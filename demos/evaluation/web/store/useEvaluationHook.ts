import { useContext } from "react";
import { EvaluationContext } from "./EvaluationContext";

export function useEvaluationState() {
    return useContext(EvaluationContext)
}