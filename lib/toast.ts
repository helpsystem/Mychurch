// Mock toast implementation - replace with real react-hot-toast
interface ToastMethods {
  success: (message: string) => void;
  error: (message: string) => void;
  loading: (message: string) => void;
  (message: string): void;
}

const mockToast: ToastMethods = Object.assign(
  (message: string) => {
    console.log('Toast:', message);
    // You can implement a simple toast UI here if needed
  },
  {
    success: (message: string) => {
      console.log('Success:', message);
      // Show success notification
    },
    error: (message: string) => {
      console.error('Error:', message);
      // Show error notification
    },
    loading: (message: string) => {
      console.log('Loading:', message);
      // Show loading notification
    }
  }
);

export const toast = mockToast;