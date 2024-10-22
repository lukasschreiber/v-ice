const COMPARISON = {
    EQUALS: "comparison_equals",
    EQUALS_WITHIN: "comparison_equals_within",
    GREATER: "comparison_greater",
    LESS: "comparison_less",
    INTERVAL: "comparison_interval",
    GREATER_EQUALS: "comparison_greater_equals",
    LESS_EQUALS: "comparison_less_equals",
    NULL: "comparison_null",
    NUMBERS: "comparison_numbers",
    MATCHES: "comparison_matches",
} as const;

const MATH = {
    NUMBER: "math_number",
    MINUS: "math_subtract",
    PLUS: "math_add",
    TIMES: "math_multiply",
    DIVIDED_BY: "math_divide",
    UNARY: "math_unary",
    BINARY: "math_binary",
    NUMBER_PROPERTY: "math_number_property",
    CONSTANTS: "math_constants",
    CONSTRAIN: "math_constrain",
} as const;

const LIST = {
    MATH: "list_math",
    LENGTH: "list_length",
    CONTAINS: "list_contains",
    ANY_ALL: "list_any_all",
    IMMEDIATE: "list_immediate",
    EQUALS: "list_equals",
    FLATTEN: "list_flatten",
} as const;

const VARIABLE = {
    GET_COLUMN: "variable_get_column",
    GET: "variable_get",
    LOCAL_GET: "local_variable_get",
} as const;

const NODE = {
    TARGET: "target_node",
    SOURCE: "source_node",
    SUBSET: "subset_node",
    SET_ARITHMETIC: "set_arithmetic_node",
} as const;

const ENUM = {
    SELECT: "enum_select",
} as const;

const STRUCTS = {
    IMMEDIATE: "struct_select",
    GET_PROPERTY: "struct_get_property",
} as const;

const STRINGS = {
    IMMEDIATE: "string_immediate",
} as const;

const HIERARCHY = {
    SELECT: "hierarchy_select",
} as const;

const LOGIC = {
    BOOLEAN: "logic_boolean",
    OR: "logic_or",
    AND: "logic_and",
    NOT: "logic_not",
} as const;

const TIMELINE = {
    QUERY: "timeline_query",
    EVENT_OCCURS: "timeline_event_occurs",
    EVENT_OCCURS_MATCH: "timeline_event_occurs_match",
    START_OF_INTERVAL: "timeline_start_of_interval",
    END_OF_INTERVAL: "timeline_end_of_interval",
    AFTER: "timeline_after",
    AFTER_INTERVAL: "timeline_after_interval",
    TIMESTAMP: "timeline_timestamp",
    DATE_PICKER: "timeline_date_picker",
    EVENT_PICKER: "timeline_event_picker",
    EITHER_OR: "timeline_either_or",
    LOOP_UNTIL: "timeline_loop_until",
    LOOP_COUNT: "timeline_loop_count",
} as const;

export {
    COMPARISON,
    MATH,
    LIST,
    VARIABLE,
    NODE,
    ENUM,
    LOGIC,
    STRUCTS,
    TIMELINE,
    HIERARCHY,
    STRINGS
};