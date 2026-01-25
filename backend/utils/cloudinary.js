const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let isConfigured = false;
let configError = null;
let lastConfigHash = null;

const ensureCloudinary = () => {
  // Check if CLOUDINARY_URL is provided (easier format)
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  
  if (cloudinaryUrl) {
    // Use CLOUDINARY_URL format (cloudinary://api_key:api_secret@cloud_name)
    try {
      cloudinary.config(cloudinaryUrl);
      const config = cloudinary.config();
      
      if (config.cloud_name && config.api_key && config.api_secret) {
        isConfigured = true;
        configError = null;
        if (!process.env.CLOUDINARY_CONFIGURED) {
          console.log('✓ Cloudinary configured successfully using CLOUDINARY_URL');
          process.env.CLOUDINARY_CONFIGURED = 'true';
        }
        return;
      }
    } catch (error) {
      console.warn('Failed to configure using CLOUDINARY_URL, trying individual variables...');
    }
  }

  // Fallback to individual variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  // Create a hash of current config to detect changes
  const currentConfigHash = `${cloudName}-${apiKey}-${apiSecret?.substring(0, 10)}`;
  
  // Reset configuration if credentials changed
  if (lastConfigHash && lastConfigHash !== currentConfigHash) {
    isConfigured = false;
    configError = null;
    console.log('⚠️  Cloudinary credentials changed, reconfiguring...');
  }

  if (isConfigured && !configError) return;
  if (configError && lastConfigHash === currentConfigHash) {
    throw configError;
  }

  // Validate that all required credentials are present
  if (!cloudName || !apiKey || !apiSecret) {
    configError = new Error(
      'Cloudinary credentials missing. Please check your .env file.\n' +
      'You can use either:\n' +
      '1. CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name\n' +
      'OR\n' +
      '2. Individual variables:\n' +
      `   CLOUDINARY_CLOUD_NAME: ${cloudName ? '✓' : '✗ Missing'}\n` +
      `   CLOUDINARY_API_KEY: ${apiKey ? '✓' : '✗ Missing'}\n` +
      `   CLOUDINARY_API_SECRET: ${apiSecret ? '✓' : '✗ Missing'}`
    );
    lastConfigHash = currentConfigHash;
    throw configError;
  }

  // Note: API secret length validation removed - Cloudinary may use different lengths
  // We'll let Cloudinary validate it during actual upload

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    // Test configuration by checking if config was set
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Failed to configure Cloudinary');
    }

    isConfigured = true;
    configError = null;
    lastConfigHash = currentConfigHash;
    
    if (!process.env.CLOUDINARY_CONFIGURED) {
      console.log('✓ Cloudinary configured successfully');
      process.env.CLOUDINARY_CONFIGURED = 'true';
    }
  } catch (error) {
    configError = new Error(
      `Cloudinary configuration failed: ${error.message}\n` +
      'Please verify your Cloudinary credentials in the .env file.'
    );
    lastConfigHash = currentConfigHash;
    throw configError;
  }
};



// Temporary storage for multer
const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing upload:', file.originalname, file.mimetype, file.size);
    const allowedTypes = /jpeg|jpg|png|pdf|webp|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream'; // Partial fix for some devices sending odd mimetypes

    if (extname) { // Relied more on extension as mimetype can be fickle
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) and PDF files are allowed'));
    }
  }
});

// Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'rydzo') => {
  const getPublicBaseUrl = () => {
    // Prefer explicit public URL if provided
    const explicit =
      process.env.PUBLIC_BACKEND_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      process.env.API_URL?.trim();

    if (explicit) return explicit.replace(/\/+$/, '');
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}`;
  };

  const asLocalUploadResult = (resolvedPath) => {
    const filename = path.basename(resolvedPath);
    const publicUrl = `${getPublicBaseUrl()}/uploads/${encodeURIComponent(filename)}`;
    return {
      secure_url: publicUrl,
      url: publicUrl,
      resource_type: 'raw',
      public_id: `local/${filename}`,
      storage: 'local'
    };
  };

  const shouldFallbackToLocal = (err) => {
    const msg = (err && err.message ? String(err.message) : '').toLowerCase();
    return (
      msg.includes('cloudinary credentials missing') ||
      msg.includes('cloudinary configuration failed') ||
      msg.includes('invalid signature') ||
      err?.http_code === 401
    );
  };

  try {
    ensureCloudinary();

    // Check if file exists
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const result = await cloudinary.uploader.upload(
      resolvedPath,
      {
        folder,
        resource_type: 'auto'
      }
    );

    // Clean up local file
    if (fs.existsSync(resolvedPath)) {
      try {
        fs.unlinkSync(resolvedPath);
      } catch (unlinkError) {
        console.warn('Failed to delete local file:', unlinkError);
      }
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('File path:', filePath);
    console.error('Resolved path:', path.resolve(filePath));

    const resolvedPath = path.resolve(filePath);
    // If Cloudinary is misconfigured/unauthorized, keep the local file and
    // return a local URL so uploads still work.
    if (fs.existsSync(resolvedPath) && shouldFallbackToLocal(error)) {
      console.warn('⚠️  Falling back to local upload URL (Cloudinary not usable).');
      return asLocalUploadResult(resolvedPath);
    }

    // Otherwise clean up local file on error
    if (fs.existsSync(resolvedPath)) {
      try {
        fs.unlinkSync(resolvedPath);
      } catch (unlinkError) {
        console.warn('Failed to delete local file after error:', unlinkError);
      }
    }

    // Provide more specific error messages
    if (error.http_code === 401) {
      throw new Error(
        'Cloudinary authentication failed. Invalid API credentials.\n' +
        'Please check your CLOUDINARY_API_SECRET in .env file.\n' +
        'Make sure:\n' +
        '1. The API secret is correct (40 characters)\n' +
        '2. There are no extra spaces or quotes\n' +
        '3. The credentials match your Cloudinary dashboard'
      );
    }
    if (error.message && error.message.includes('Invalid API')) {
      throw new Error('Cloudinary configuration error. Please check your API credentials.');
    }
    if (error.http_code === 400) {
      throw new Error('Invalid file format or corrupted file.');
    }
    if (error.http_code === 403) {
      throw new Error('Cloudinary access forbidden. Check your account permissions.');
    }

    throw error;
  }
};


// Upload single file
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Upload multiple files
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadSingle,
  uploadMultiple,
  uploadToCloudinary,
  deleteFile
};

