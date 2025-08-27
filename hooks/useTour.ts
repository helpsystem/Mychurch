
import { useContext } from 'react';
import { TourContext, TourContextType } from '../context/TourContext';

export const useTour = (): TourContextType => {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};
