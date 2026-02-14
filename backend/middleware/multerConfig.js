const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const ensureDirExists = async (dirPath) => {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error('Error creating directory:', error);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
};

// Student profile photo storage
const studentProfileStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    await ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `student-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Staff profile photo storage
const staffProfileStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/staff-profiles');
    await ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `staff-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Other uploads (certificates, etc.)
const generalStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    await ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

module.exports = {
  studentProfileUpload: multer({
    storage: studentProfileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only images are allowed'));
      }
    }
  }).single('photo'),

  staffProfileUpload: multer({
    storage: staffProfileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only images are allowed'));
      }
    }
  }).single('photo'),

  generalUpload: multer({
    storage: generalStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      cb(null, true);
    }
  })
};
