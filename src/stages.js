import {
  initialStage,
  stageOne,
  stageTwo,
  stageThree,
  stageFour,
  finalStage,
  acrStage,
} from './stages/index.js';

import { getState, setState } from './storage.js';

export const stages = [
  {
    descricao: 'Welcome',
    stage: initialStage,
  },
  {
    descricao: 'Menu',
    stage: stageOne,
  },
  {
    descricao: 'Address',
    stage: stageTwo,
  },
  {
    descricao: 'Bill',
    stage: stageThree,
  },
  {
    descricao: 'New Order',
    stage: stageFour,
  },
  {
    descricao: 'Assistent',
    stage: finalStage,
  },
  {
    descricao: 'Abandoned Cart Recovery',
    stage: acrStage,
  },
];

export function getState_wrapper({ from }) {
  return getState(from);
}
