import { IEventType, StructFields, IIntervalType, ValueOf, IListType, UnionType } from "@/data/types";
import { DateTimeGranularityType } from "@/utils/datetime";

export type TimelineTemplate = (TimelineTemplateEvent | TimelineTemplateDate | TimelineTemplateSkip | TimelineTemplateSkipInterval | TimelineTemplateInterval | TimelineTemplateNoInterval | TimelineTemplateNoEvent | TimelineTemplateOptions | TimelineTemplateLoopCount | TimelineTemplateLoopUntil)[]
export interface TimelineTemplateEntry {
    type_: string
}
export enum EventOp {
    OCCURS = "OCCURS", 
    DOES_NOT_OCCUR = "DOES_NOT_OCCUR", 
    FIRST_OCCURRENCE = "FIRST_OCCURRENCE", 
    LAST_OCCURRENCE = "LAST_OCCURRENCE",
    DOES_NOT_OCCUR_FOR = "DOES_NOT_OCCUR_FOR"
}
export enum TimeUnit {
    SECOND = "s", 
    MINUTE = "m", 
    HOUR = "h", 
    DAY = "d", 
    WEEK = "w", 
    MONTH = "M", 
    YEAR = "y"
}
export enum SkipOp {
    EXACTLY = "EXACTLY",
    AT_LEAST = "AT_LEAST",
    AT_MOST = "AT_MOST"
}
export interface TimelineTemplateEventMeta {
    type: string
    [key: string]: unknown
}

export type MatchableEvent = {
    event: TimelineTemplateEventMetaType,
    limit?: "start" | "end"
}
export type TimelineTemplateEventMetaType = TimelineTemplateEventMeta | ((event: TimelineTemplateEventMeta) => boolean)

export interface TimelineTemplateEvent extends AbstractTimelineTemplateEvent {
    type_: "event"
}
interface AbstractTimelineTemplateEvent extends TimelineTemplateEntry {
    event: TimelineTemplateEventMetaType
    op: EventOp
}
interface AbstractTimelineTemplateNoEvent extends TimelineTemplateEntry {
    event: TimelineTemplateEventMetaType
    duration: number
    unit: TimeUnit
}
export interface TimelineTemplateNoEvent extends AbstractTimelineTemplateNoEvent {
    type_: "no_event"
}
export interface TimelineTemplateInterval extends AbstractTimelineTemplateEvent {
    type_: "interval"
    limit: "start" | "end"
}
export interface TimelineTemplateNoInterval extends AbstractTimelineTemplateNoEvent {
    type_: "no_interval"
    limit: "start" | "end"
}
export interface TimelineTemplateDate extends TimelineTemplateEntry {
    type_: "date"
    timestamp: {timestamp: string, masked?: DateTimeGranularityType[]}
}
export interface TimelineTemplateSkipBase extends TimelineTemplateEntry {
    unit: TimeUnit

}
export interface TimelineTemplateSkip extends TimelineTemplateSkipBase {
    type_: "skip"
    duration: number
    op: SkipOp
}
export interface TimelineTemplateSkipInterval extends TimelineTemplateSkipBase {
    type_: "skip_interval"
    minDuration: number
    maxDuration: number
}
export interface TimelineTemplateOptions extends TimelineTemplateEntry {
    type_: "options"
    options: TimelineTemplate[]
}
export interface TimelineTemplateLoopUntil extends TimelineTemplateEntry {
    type_: "loop_until"
    untilEvent: TimelineTemplateEventMeta
    template: TimelineTemplate
}
export interface TimelineTemplateLoopCount extends TimelineTemplateEntry {
    type_: "loop_count"
    count: number
    template: TimelineTemplate
}

export type TimelineEntry<T extends StructFields> = ValueOf<IEventType<T>> | ValueOf<IIntervalType<T>>
export type Timeline<T extends StructFields> = ValueOf<IListType<UnionType<[IEventType<T>, IIntervalType<T>]>>>