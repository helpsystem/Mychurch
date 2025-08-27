import React from 'react';
import { PrayerRequest } from '../types';
import PrayerCard from './PrayerCard';

interface Props {
    prayerRequests: PrayerRequest[];
}

const PrayerWall: React.FC<Props> = ({ prayerRequests }) => {
    return (
        <div className="prayer-wall">
            {prayerRequests.map(prayer => (
                <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
        </div>
    );
};

export default PrayerWall;