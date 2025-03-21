import React from 'react';
import { WelcomeLayout, PrerequisitesGuide } from 'src/components/suite';
import type { PrerequisiteType } from 'src/types/suite';

interface Props {
    prerequisite: PrerequisiteType;
}

const PrerequisiteScreen = ({ prerequisite }: Props) => (
    <WelcomeLayout>
        <PrerequisitesGuide prerequisite={prerequisite} padded allowSwitchDevice />
    </WelcomeLayout>
);

export default PrerequisiteScreen;
