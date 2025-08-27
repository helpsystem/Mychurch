import { useContext } from 'react';
import { ContentContext } from '../context/ContentContext';
import { ContentContextType } from '../types';

export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
