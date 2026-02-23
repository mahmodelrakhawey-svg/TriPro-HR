import { supabase } from '../supabaseClient';

/**
 * Initializes the internal error monitoring system.
 * This should be called once when the application starts.
 */
export const initMonitoring = () => {
  console.log('✅ TriPro Internal Error Monitoring Initialized');

  // Capture unhandled global errors
  window.onerror = (message, source, lineno, colno, error) => {
    logError(error || message, `GlobalError: ${source}:${lineno}:${colno}`);
    return true; // Prevents the default browser console error
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = (event) => {
    logError(event.reason, 'UnhandledPromiseRejection');
  };
};

/**
 * Logs an error to the Supabase 'error_logs' table.
 * @param error The error object or message to log.
 * @param context A string providing context about where the error occurred.
 */
export const logError = async (error: any, context?: string) => {
  // Log to console for immediate debugging
  console.error(`[${context || 'Error'}]:`, error);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const errorLog = {
      message: error?.message || String(error),
      stack: error?.stack || null,
      context: { location: context, userAgent: navigator.userAgent },
      url: window.location.href,
      user_id: user?.id || null,
    };

    const { error: insertError } = await supabase.from('error_logs').insert(errorLog);

    if (insertError) {
      console.error('Failed to log error to Supabase:', insertError);
    }
  } catch (loggingError) {
    console.error('CRITICAL: Failed to execute error logging function:', loggingError);
  }
};
