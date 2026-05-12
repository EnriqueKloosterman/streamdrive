const { Lesson } = require('../models');
const { invalidateCache } = require('../middleware/cache');
const { getDriveClient } = require('../config/googleClient');

async function getLesson(req, res, next) {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }

    res.json({
      id: lesson.id,
      courseId: lesson.course_id,
      title: lesson.title,
      description: lesson.description,
      summary: lesson.summary,
      order: lesson.order,
      duration: lesson.duration,
    });
  } catch (error) {
    next(error);
  }
}

async function updateLesson(req, res, next) {
  try {
    const { title, description, summary, chapters } = req.body;
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (summary !== undefined) lesson.summary = summary;
    if (chapters !== undefined) lesson.chapters = JSON.stringify(chapters);

    await lesson.save();
    invalidateCache(`/api/courses/${lesson.course_id}`);

    res.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      summary: lesson.summary,
      chapters: chapters || [],
    });
  } catch (error) {
    next(error);
  }
}

async function streamVideo(req, res, next) {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }

    const drive = getDriveClient();
    const fileId = lesson.drive_file_id;

    const meta = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size',
    });

    const fileSize = parseInt(meta.data.size, 10);
    const mimeType = meta.data.mimeType || 'video/mp4';

    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
      });

      const driveStream = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      driveStream.data.pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
      });
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    const driveStream = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    let bytesRead = 0;
    driveStream.data.on('data', (chunk) => {
      if (bytesRead + chunk.length <= start) {
        bytesRead += chunk.length;
        return;
      }

      const chunkStart = Math.max(0, start - bytesRead);
      const chunkEnd = Math.min(chunk.length, end - bytesRead + 1);
      const sliced = chunk.slice(chunkStart, chunkEnd);

      if (sliced.length > 0) {
        res.write(sliced);
      }

      bytesRead += chunk.length;

      if (bytesRead > end) {
        driveStream.data.destroy();
        res.end();
      }
    });

    driveStream.data.on('end', () => {
      if (!res.writableEnded) res.end();
    });
  } catch (error) {
    if (error.code === 404) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Video file not found in Drive.' },
      });
    }
    next(error);
  }
}

async function getSubtitle(req, res, next) {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }
    if (!lesson.subtitles) {
      return res.status(404).json({
        error: { code: 'SUBTITLE_NOT_FOUND', message: 'No subtitles for this lesson.' },
      });
    }

    const subs = JSON.parse(lesson.subtitles);
    const index = parseInt(req.params.index, 10);
    const sub = subs[index];
    if (!sub) {
      return res.status(404).json({
        error: { code: 'SUBTITLE_NOT_FOUND', message: 'Subtitle track not found.' },
      });
    }

    const drive = getDriveClient();
    const content = await drive.files.get(
      { fileId: sub.driveFileId, alt: 'media' },
      { responseType: 'text' }
    );

    let body = content.data;
    if (sub.format === 'srt') {
      body = srtToVtt(body);
    } else if (!body.startsWith('WEBVTT')) {
      body = 'WEBVTT\n\n' + body;
    }

    res.writeHead(200, {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Content-Length': Buffer.byteLength(body, 'utf-8'),
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
  } catch (error) {
    next(error);
  }
}

function srtToVtt(srt) {
  return 'WEBVTT\n\n' +
    srt
      .replace(/\r\n/g, '\n')
      .replace(/(\d+:\d+:\d+),(\d+)/g, '$1.$2')
      .replace(/(\d+):(\d+\.\d+)/g, '00:$1:$2');
}

module.exports = { getLesson, updateLesson, streamVideo, getSubtitle };
