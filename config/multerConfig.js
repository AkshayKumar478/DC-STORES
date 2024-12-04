const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads'); 
  },
 
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + path.extname(file.originalname)); 
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png,webp) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, 
  fileFilter: fileFilter
});

module.exports = upload;
