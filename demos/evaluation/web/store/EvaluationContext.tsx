import { createContext } from "react";
import useLocalStorage from "./useLocalStorage";
import { EvaluationAction, EvaluationActionPayloads } from "v-ice/dist/evaluation_emitter";
import { ISerializedWorkspace } from "../../../../dist/serializer";

export interface IEvaluation {
    user: {
        code: string;
        consentGiven: boolean;
        browser: {
            userAgent: string;
            isBrave: boolean;
            screenMetrics: {
                width: number;
                height: number;
            };
            prefersDarkMode: boolean;
        }
    };
    results: {
        [key: string]: {
            [key: string]: {answer: string | string[], unsure: boolean}
        }
    };
    tasks: {
        [key: string]: {
            [key: string]: IEvaluationTaskResult
        }
    }
}

export interface IEvaluationTaskResult {
    isPractice: boolean;
    recall: number;
    precision: number;
    time: number;
    chosenEntities: Record<string, number[]>;
    events: {name: EvaluationAction, time: number, payload: EvaluationActionPayloads[EvaluationAction]}[];
    resultWorkspace: ISerializedWorkspace;

}

type NestedKeys<T> = {
    [K in keyof T]: K extends string ?  T[K] extends object ? `${K}` | `${K}.${NestedKeys<T[K]>}` : `${K}` : never;
}[keyof T];

type NestedValue<T, K extends string> = 
  K extends `${infer P}.${infer R}` ? 
    P extends keyof T ? NestedValue<T[P], R> : never 
  : K extends keyof T ? T[K] : never;

interface IEvaluationContext {
    evaluation: Partial<IEvaluation>;
    setEvaluationProperty<K extends NestedKeys<IEvaluation>>(key: K, value: NestedValue<IEvaluation, K>): void;
}

export const EvaluationContext = createContext<IEvaluationContext>({
    evaluation: {},
    setEvaluationProperty: () => {},
});

const LOCAL_STORAGE_KEY = "evaluation";

export function EvaluationProvider(props: React.ComponentPropsWithoutRef<"div">) {
    const [evaluation, setEvaluation] = useLocalStorage(LOCAL_STORAGE_KEY, {} as Partial<IEvaluation>);    

    function setEvaluationProperty<K extends NestedKeys<IEvaluation>>(key: K, value: NestedValue<IEvaluation, K>) {
        setEvaluation((prevEvaluation) => {
            const keys = key.split('.')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newEvaluation = { ...prevEvaluation } as any;
            let currentLevel = newEvaluation;

            for (let i = 0; i < keys.length - 1; i++) {
                const keyPart = keys[i];

                if (!currentLevel[keyPart]) {
                    currentLevel[keyPart] = {};
                }
                
                currentLevel = currentLevel[keyPart];
            }
            
            currentLevel[keys[keys.length - 1]] = value;

            return newEvaluation;
        });
    }

    return <EvaluationContext.Provider value={{ evaluation, setEvaluationProperty }}>{props.children}</EvaluationContext.Provider>;
}
