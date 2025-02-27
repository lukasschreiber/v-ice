import { createDispatchHook, createSelectorHook, ReactReduxContextValue, TypedUseSelectorHook, UseDispatch } from 'react-redux'
import type { AppDispatch, RootState } from './store'
import { createContext } from 'react';

export const ApplicationContext = createContext<ReactReduxContextValue<RootState> | null>(null);

export const useDispatch: UseDispatch<AppDispatch> = createDispatchHook(ApplicationContext)
export const useSelector: TypedUseSelectorHook<RootState> = createSelectorHook(ApplicationContext)