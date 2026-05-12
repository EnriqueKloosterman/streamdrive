const { getDriveClient } = require('../config/googleClient');
const { Course, Lesson } = require('../models');

async function syncFromDrive() {
  const drive = getDriveClient();
  const folderIds = (process.env.GOOGLE_DRIVE_FOLDER_ID || '').split(',').map(s => s.trim()).filter(Boolean);

  const courseFolders = [];
  const updatedCourseIds = [];
  const errors = [];

  for (const rootId of folderIds) {
    try {
      const hasCourseMd = await folderHasCourseMd(drive, rootId);

      if (hasCourseMd) {
        const meta = await drive.files.get({ fileId: rootId, fields: 'id, name' });
        courseFolders.push({ id: rootId, name: meta.data.name });
        console.log(`[Sync] Root ${rootId}: treated as course (has course.md)`);
      } else {
        const folders = await listCourseFolders(drive, rootId);
        console.log(`[Sync] Root ${rootId}: ${folders.length} course folders found`);
        courseFolders.push(...folders);
      }
    } catch (err) {
      const msg = `Root ${rootId}: ${err.message}`;
      console.error(`[Sync Error] ${msg}`);
      errors.push(msg);
    }
  }

  for (const folder of courseFolders) {
    try {
      const course = await syncCourse(drive, folder);
      updatedCourseIds.push(course.id);
    } catch (err) {
      const msg = `Course ${folder.name} (${folder.id}): ${err.message}`;
      console.error(`[Sync Error] ${msg}`);
      errors.push(msg);
    }
  }

  const syncedIds = courseFolders.map(f => f.id);
  const removed = await Course.destroy({
    where: { drive_folder_id: { [require('sequelize').Op.notIn]: syncedIds } },
  });
  if (removed > 0) console.log(`[Sync] Removed ${removed} orphaned courses`);

  return { totalCourses: courseFolders.length, updatedCourseIds, errors: errors.length > 0 ? errors : undefined };
}

async function listCourseFolders(drive, parentId) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });

  return res.data.files || [];
}

async function folderHasCourseMd(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = 'course.md' and trashed = false`,
    fields: 'files(id)',
  });
  return (res.data.files || []).length > 0;
}

async function syncCourse(drive, folder) {
  const [courseMeta, files] = await Promise.all([
    readCourseMetadata(drive, folder.id),
    listFilesInFolder(drive, folder.id),
  ]);

  await Course.upsert({
    drive_folder_id: folder.id,
    title: courseMeta.title || folder.name,
    description: courseMeta.description || null,
    tags: courseMeta.tags || [],
    image_url: courseMeta.image_url || null,
    last_sync: new Date(),
  });
  const course = await Course.findOne({ where: { drive_folder_id: folder.id } });

  const videoFiles = files.filter(f =>
    /\.(mp4|mkv|webm|mov)$/i.test(f.name)
  ).sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < videoFiles.length; i++) {
    const video = videoFiles[i];
    const baseName = video.name.replace(/\.(mp4|mkv|webm|mov)$/i, '');
    const mdFile = files.find(f =>
      f.name === `${baseName}.md` || f.name === `${baseName}.markdown`
    );

    let summary = null;
    if (mdFile) {
      summary = await readFileContent(drive, mdFile.id);
    }

    const subFiles = files.filter(f => {
      const lower = f.name.toLowerCase();
      return (lower.endsWith('.vtt') || lower.endsWith('.srt')) &&
        f.name.replace(/\.(vtt|srt)$/i, '') === baseName;
    });

    const subtitleLangFiles = files.filter(f => {
      const lower = f.name.toLowerCase();
      if (!lower.endsWith('.vtt') && !lower.endsWith('.srt')) return false;
      const ext = f.name.match(/\.(vtt|srt)$/i)?.[1];
      if (!ext) return false;
      const withoutExt = f.name.slice(0, -(ext.length + 1));
      const langMatch = withoutExt.match(/^(.+)\.([a-z]{2,3})$/i);
      if (!langMatch) return false;
      return langMatch[1] === baseName;
    });

    const allSubFiles = [...subFiles, ...subtitleLangFiles];
    const seen = new Set();
    const uniqueSubs = [];
    for (const sf of allSubFiles) {
      if (seen.has(sf.id)) continue;
      seen.add(sf.id);
      const ext = sf.name.match(/\.(vtt|srt)$/i)?.[1];
      const withoutExt = sf.name.slice(0, -(ext.length + 1));
      const langMatch = withoutExt.match(/\.([a-z]{2,3})$/i);
      const lang = langMatch?.[1] || 'en';
      const label = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) || lang;
      uniqueSubs.push({ driveFileId: sf.id, language: lang, label, format: ext.toLowerCase() });
    }

    await Lesson.upsert({
      course_id: course.id,
      drive_file_id: video.id,
      title: video.name,
      order: i + 1,
      summary,
      section: video.section || null,
      subtitles: uniqueSubs.length > 0 ? JSON.stringify(uniqueSubs) : null,
    });
  }

  return course;
}

async function readCourseMetadata(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = 'course.md' and trashed = false`,
    fields: 'files(id)',
  });

  if (!res.data.files?.length) return {};

  const content = await readFileContent(drive, res.data.files[0].id);

  const knownKeys = ['title', 'description', 'tags', 'image'];
  const keyPattern = knownKeys.join('|');

  function extractValue(key) {
    const re = new RegExp(
      `(?:^|\\n)[^\\n]*?\\b${key}:\\s*(.+?)(?=\\s*\\b(?:${keyPattern}):|$)`,
      'ims'
    );
    const m = content.match(re);
    if (!m) return undefined;
    let val = m[1].replace(/^['"]|['"]$/g, '').trim();
    if (!val || val === '---') return undefined;
    return val;
  }

  function parseTags() {
    const raw = extractValue('tags');
    if (!raw) return [];

    const bracketMatch = raw.match(/^\[(.+?)\]$/);
    if (bracketMatch) return bracketMatch[1].split(',').map(t => t.trim()).filter(Boolean);

    return raw.split(',').map(t => t.trim()).filter(Boolean);
  }

  return {
    title: extractValue('title'),
    description: extractValue('description'),
    tags: parseTags(),
    image_url: extractValue('image') || null,
  };
}

async function listFilesInFolder(drive, courseFolderId) {
  const allFiles = [];
  const queue = [{ folderId: courseFolderId, section: null }];

  while (queue.length > 0) {
    const { folderId, section } = queue.shift();
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size)',
      orderBy: 'name',
      pageSize: 1000,
    });

    for (const file of (res.data.files || [])) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const childSection = folderId === courseFolderId ? file.name : section;
        queue.push({ folderId: file.id, section: childSection });
      } else {
        allFiles.push({ ...file, section });
      }
    }
  }

  return allFiles;
}

async function readFileContent(drive, fileId) {
  const meta = await drive.files.get({
    fileId,
    fields: 'id, mimeType',
  });

  if (meta.data.mimeType?.startsWith('application/vnd.google-apps.')) {
    const res = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' }
    );
    return res.data;
  }

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  );
  return res.data;
}

async function getStreamData(fileId) {
  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });

  return {
    fileId,
    name: meta.data.name,
    mimeType: meta.data.mimeType,
    size: parseInt(meta.data.size, 10) || 0,
    streamUrl: `/api/lessons/${fileId}/stream`,
  };
}

module.exports = { syncFromDrive, getStreamData };
