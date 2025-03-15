/* eslint-disable react-hooks/exhaustive-deps */
import { DependencyList, EffectCallback, useEffect } from 'react';
import { usePrevious } from './usePrevious';

export const useEffectDebugger = (effectHook: EffectCallback, dependencies: DependencyList, dependencyNames = []) => {
  const previousDeps = usePrevious<typeof dependencies>(dependencies, []);

  const changedDeps = dependencies.reduce((accum: Record<string, unknown>, dependency: unknown, index: number) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps);
  }

  useEffect(effectHook, dependencies);
};
