const { Lesson } = require('../models');
const { invalidateCache } = require('../middleware/cache');
const { getDriveClient } = require('../config/googleClient');
const NodeCache = require('node-cache');

const videoMetaCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const MAX_VIDEO_CHUNK_SIZE = 10 * 1024 * 1024;

async function getVideoMeta(drive, fileId) {
  const cached = videoMetaCache.get(fileId);
  if (cached) return cached;

  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });

  const data = {
    fileSize: parseInt(meta.data.size, 10),
    mimeType: meta.data.mimeType || 'video/mp4',
  };

  videoMetaCache.set(fileId, data);
  return data;
}

function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader || !Number.isFinite(fileSize) || fileSize <= 0) return null;

  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const [, startRaw, endRaw] = match;
  if (!startRaw && !endRaw) return null;

  let start;
  let end;

  if (!startRaw) {
    const suffixLength = parseInt(endRaw, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    start = parseInt(startRaw, 10);
    end = endRaw ? parseInt(endRaw, 10) : fileSize - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start >= fileSize || start > end) return null;

  end = Math.min(end, fileSize - 1, start + MAX_VIDEO_CHUNK_SIZE - 1);

  return { start, end, chunkSize: end - start + 1 };
}

function pipeDriveStream(driveStream, res, next) {
  const upstream = driveStream.data;

  upstream.on('error', (error) => {
    console.error('[Drive Stream Error]', error.message);
    if (res.headersSent) {
      res.destroy(error);
    } else {
      next(error);
    }
  });

  res.on('close', () => {
    if (!res.writableEnded && upstream.destroy) upstream.destroy();
  });

  upstream.pipe(res);
}

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
      thumbnail_url: lesson.thumbnail_url,
      qualities: lesson.qualities ? JSON.parse(lesson.qualities) : null,
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

    let fileId = lesson.drive_file_id;
    const quality = req.query.quality;
    if (quality && lesson.qualities) {
      try {
        const qualities = JSON.parse(lesson.qualities);
        const found = qualities.find(q => q.label.toLowerCase() === quality.toLowerCase());
        if (found) fileId = found.drive_file_id;
      } catch (e) {
        // ignore invalid qualities JSON
      }
    }

    const drive = getDriveClient();

    const { fileSize, mimeType } = await getVideoMeta(drive, fileId);
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return res.status(502).json({
        error: { code: 'GOOGLE_API_ERROR', message: 'Video size is unavailable from Drive.' },
      });
    }

    const range = req.headers.range;
    if (!range) {
      const driveStream = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
      });

      pipeDriveStream(driveStream, res, next);
      return;
    }

    const parsedRange = parseRangeHeader(range, fileSize);
    if (!parsedRange) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
      });
      res.end();
      return;
    }

    const { start, end, chunkSize } = parsedRange;
    const driveStream = await drive.files.get(
      { fileId, alt: 'media' },
      {
        responseType: 'stream',
        headers: { Range: `bytes=${start}-${end}` },
      }
    );

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    pipeDriveStream(driveStream, res, next);
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

async function saveThumbnail(req, res, next) {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }

    const { dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'dataUrl is required.' },
      });
    }

    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data URL format.' },
      });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const filename = `${lesson.id}.${ext}`;
    const fs = require('fs');
    const path = require('path');
    const thumbnailsDir = path.resolve(__dirname, '../../thumbnails');

    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(thumbnailsDir, filename), base64Data, 'base64');

    lesson.thumbnail_url = `/thumbnails/${filename}`;
    await lesson.save();

    res.json({ thumbnail_url: lesson.thumbnail_url });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLesson,
  updateLesson,
  streamVideo,
  getSubtitle,
  saveThumbnail,
  __private: {
    parseRangeHeader,
    MAX_VIDEO_CHUNK_SIZE,
  },
};
