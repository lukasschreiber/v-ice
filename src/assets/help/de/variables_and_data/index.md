## Variablen und Datentypen

Beim Öffnen des Programms wird eine Liste von Variablen angezeigt, die in der Datenbank verfügbar sind. Die Variablen können in den Blöcken verwendet werden, um die Kohorte zu filtern. Die Variablen haben unterschiedliche Datentypen, die in den Blöcken verwendet werden können.

Die Datentypen werden über die äußere Form der Variablen angezeigt sowie über ein Symbol, das den Datentyp repräsentiert. Die folgenden Datentypen sind verfügbar:
| Icon | Typ | Beschreibung |
|------|---------------------|-----------------------------------------------------------|
| :type-icon{type="Enum<*>"} | **Aufzählung** | Textdaten mit einer begrenzten Anzahl von Werten |
| :type-icon{type="Number"} | **Zahl** | Numerische Daten |
| :type-icon{type="Timestamp"} | **Zeit** | Datum und Uhrzeit |
| :type-icon{type="Boolean"} | **Boolesch** | Wahrheitswerte |
| :type-icon{type="List<*>"} | **Liste** | Eine Liste von Werten, z.B. eine Liste von Zahlen :type-icon{type="List<Number>"} oder Texten :type-icon{type="List<String>"}. |
| :type-icon{type="String"} | **Text** | Textdaten |
| :type-icon{type="Hierarchy<*>"} | **Hierarchie** | Hierarchische Daten, z.B. ICD10 für Krankheiten |
| :type-icon{type="{*}"} | **Struktur** | Strukturierte Daten, z.B. eine Adresse mit Straße, PLZ und Stadt |
| :type-icon{type="Timeline<*>"} | **Zeitleiste** | Zeitbezogene Daten, z.B. ein Zeitraum von Datum und Uhrzeit; eine Zeitleiste besteht aus Ereignissen :type-icon{type="{timestamp: Timestamp, type: Enum<*>}"} und/oder Intervallen :type-icon{type="{start: Timestamp, end: Timestamp, type: Enum<*>}"}. |
| :type-icon{type="*"} | **Beliebig** | Beliebiger Datentyp; dieser Datentyp wird vor allem verwendet, um in einem Block mehr als einen Datentyp zu erlauben. Siehe zum Beispiel [Gleichheits-Block](#equals). |

Jeder Typ kann auch in einer `nullable` Variante vorkommen, das bedeutet, dass die Spalte auch ungültige/nicht vorhandene Werte beinhalten kann. Die Typ-Icons sind in diesem Fall nicht ausgefüllt, z.B. :type-icon{type="Number?"} oder :type-icon{type="List<Number>?"}.