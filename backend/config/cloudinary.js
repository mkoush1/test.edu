// Cloudinary configuration
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary with environment variables or fallback to hard-coded values
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dn79b1rvu',
  api_key: process.env.CLOUDINARY_API_KEY || '537399973664827', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HiAjN6oW4wEXfxErN4XaDhHtCFE'
});

console.log('Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME || 'dn79b1rvu');

export default cloudinary; 