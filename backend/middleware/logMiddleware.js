// logMiddleware.js
// Simple middleware to log API requests

/**
 * Logs request details to the console
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const logMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    // Log request body but skip sensitive data or large uploads
    const safeBody = { ...req.body };
    
    // Remove potentially sensitive fields
    ['password', 'token', 'secret', 'audio', 'video', 'audioBase64', 'videoBase64'].forEach(field => {
      if (safeBody[field]) {
        safeBody[field] = safeBody[field] instanceof String && safeBody[field].length > 20 
          ? `[${field}:${safeBody[field].length} chars]` 
          : '[REDACTED]';
      }
    });
    
    // Truncate large text fields
    Object.keys(safeBody).forEach(key => {
      if (typeof safeBody[key] === 'string' && safeBody[key].length > 100) {
        safeBody[key] = `[${safeBody[key].substring(0, 100)}... (${safeBody[key].length} chars)]`;
      }
    });
    
    console.log('Request body:', safeBody);
  }
  
  // Log query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query params:', req.query);
  }
  
  // Save original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function() {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    // Call original end function
    return originalEnd.apply(res, arguments);
  };
  
  next();
};

// Export for ES Modules (import)
export const logRequest = logMiddleware;
export default logMiddleware; 