import "blockly/blocks";
import { Variables } from "@/toolbox/categories/variables";
import { Nodes } from "./categories/nodes";
import { DateTime } from "luxon";
import { FibBlock, MathBinaryOperationBlock, MathDividedByBlock, MathMinusBlock, MathNumberPropertyBlock, MathPlusBlock, MathTimesBlock, MathUnaryOperationBlock } from "@/blocks/definitions/math";
import { CompareIntervalBlock, CompareNumbersBlock, EqualsBlock, EqualsWithinBlock, GreaterBlock, GreaterEqualsBlock, HasVariableValueBlock, IsNullBlock, LessBlock, LessEqualsBlock, MatchesBlock } from "@/blocks/definitions/comparisons";
import { ListAnyAllBlock, ListArithmeticBlock, ListContainsBlock, ListEqualsBlock, ListLengthBlock } from "@/blocks/definitions/lists";
import { ProperySelectBlock } from "@/blocks/definitions/structs";
import { LogicNotBlock, LogicOrBlock } from "@/blocks/definitions/logic";
import { TimelineAfterBlock, TimelineAfterIntervalBlock, TimelineDateBlock, TimelineEventOccursMatchBlock, TimelineOrBlock, TimelineQueryBlock, TimelineRepeatBlock, TimestampBlock } from "@/blocks/definitions/timeline";
import { buildBlock, buildDynamicCategory, buildStaticCategory, buildToolbox } from "./builder";
import { Favorites } from "./categories/favorites";

export const DefaultToolbox = buildToolbox()
    .addDynamicCategory(buildDynamicCategory("Favorites", "favorites_category").withInstance(Favorites).withMetadata({ noHighlight: true, sortable: false, filterable: true }).build())
    .addDynamicCategory(buildDynamicCategory("%{BKY_VARIABLES}", "variables_category").withInstance(Variables).withMetadata({ filterable: true, sortable: true }).build())
    .addStaticCategory(buildStaticCategory("%{BKY_COMPARISONS}", "comparisons_category")
        .addBlock(buildBlock(EqualsBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MatchesBlock).withEmptyInputs().build())
        .addBlock(buildBlock(EqualsWithinBlock).withEmptyInputs().build())
        .addBlock(buildBlock(GreaterBlock).withEmptyInputs().build())
        .addBlock(buildBlock(LessBlock).withEmptyInputs().build())
        .addBlock(buildBlock(GreaterEqualsBlock).withEmptyInputs().build())
        .addBlock(buildBlock(LessEqualsBlock).withEmptyInputs().build())
        .addBlock(buildBlock(CompareIntervalBlock).withEmptyInputs().build())
        .addBlock(buildBlock(CompareNumbersBlock).withEmptyInputs().build())
        .addBlock(buildBlock(IsNullBlock).withEmptyInputs().withCondition((_workspace, table) => {
            return !table.some(col => col.type.nullable)
        }).build())
        .addBlock(buildBlock(HasVariableValueBlock).withEmptyInputs().withCondition((_workspace, table) => {
            return !table.some(col => col.type.nullable)
        }).build())
        .build())
    .addStaticCategory(buildStaticCategory("%{BKY_ARITHMETIC}", "math_category")
        .addBlock(buildBlock(MathPlusBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MathMinusBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MathTimesBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MathDividedByBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MathBinaryOperationBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MathUnaryOperationBlock).withEmptyInputs().build())
        .addBlock(buildBlock(MathNumberPropertyBlock).withEmptyInputs().build())
        .addBlock(buildBlock(FibBlock).withEmptyInputs().build())
        .build())
    .addStaticCategory(buildStaticCategory("%{BKY_LISTS}", "list_category")
        .addBlock(buildBlock(ListArithmeticBlock).build())
        .addBlock(buildBlock(ListLengthBlock).build())
        .addBlock(buildBlock(ListContainsBlock).build())
        .addBlock(buildBlock(ListEqualsBlock).build())
        .addBlock(buildBlock(ListAnyAllBlock).build())
        .addBlock(buildBlock(ProperySelectBlock).build())
        .build())
    .addStaticCategory(buildStaticCategory("%{BKY_LOGIC}", "logic_category")
        .addBlock(buildBlock(LogicOrBlock).build())
        .addBlock(buildBlock(LogicNotBlock).build())
        .build())
    .addStaticCategory(buildStaticCategory("%{BKY_TIMELINE}", "history_category")
        .addBlock(buildBlock(TimelineQueryBlock).withEmptyInputs().build())
        .addBlock(buildBlock(TimelineEventOccursMatchBlock).withEmptyInputs().build())
        .addBlock(buildBlock(TimestampBlock).withInputs({
            TIMESTAMP: {
                shadow: buildBlock(TimelineDateBlock).withFields({
                    TIMESTAMP: {
                        value: DateTime.local().toFormat("dd.MM.yyyy"),
                    }
                }).build()
            }
        }).build())
        .addBlock(buildBlock(TimelineAfterBlock).withEmptyInputs().build())
        .addBlock(buildBlock(TimelineAfterIntervalBlock).withEmptyInputs().build())
        .addBlock(buildBlock(TimelineOrBlock).build())
        .addBlock(buildBlock(TimelineRepeatBlock).withEmptyInputs().build())
        .build())
    .addDynamicCategory(buildDynamicCategory("%{BKY_NODES}", "nodes_category").withInstance(Nodes).build())
    .build()