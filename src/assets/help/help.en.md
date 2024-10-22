# Manual

## Schnellstart

1. Starten Sie eine Kohortenauswahl, indem Sie aus dem Werkzeugkasten auf der linken Seite einen [:inline-block-preview{block="{'type': 'source_node'}" text="Quell-Block"}](#source-node) auswählen und auf den Arbeitsbereich ziehen. Dieser Block wird als Startpunkt für die Kohorte verwendet.
2. Ziehen Sie einen [:inline-block-preview{block="{'type': 'subset_node'}" text="Filter-Block"}](#subset-node) auf den Arbeitsbereich, um die Kohorte zu filtern. Benennen Sie diesen Block, um ihn später wiederzufinden. Ziehen Sie Filterblöcke auf den Arbeitsbereich, um die Kohorte weiter zu filtern.
3. Ziehen Sie einen [:inline-block-preview{block="{'type': 'target_node'}" text="Ziel-Block"}](#target-node) auf den Arbeitsbereich, um die Kohorte zu speichern. Dieser Block wird als Endpunkt für die Kohorte verwendet. Die Kohorte wird in diesem Block gespeichert.
4. Verbinden Sie die Blöcke, indem Sie nacheinander auf die Verbindungspunkte klicken. 
5. Die Kohorte wird automatisch berechnet, wenn alle Blöcke verbunden sind.

![https://lukasschreiber.com/media/quickstart.webm](https://lukasschreiber.com/media/quickstart.webm)

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

### Variablen :anchor{id="variables"}

Für jede Spalte in der Datenbank wird eine Variable erstellt. Die Variablen können in den Blöcken verwendet werden, um die Kohorte zu filtern. Die Variablen haben einen Namen, der den Spaltennamen in der Datenbank entspricht.

Die Variable im Beispiel trägt den Namen "Alter" und hat den Datentyp `Zahl`. Zusätzlich zur Darstellung des Datentyps durch ein Symbol wird der Datentyp auch durch die äußere Form der Variablen angezeigt, in diesem Fall ein abgerundetes Rechteck.

::block-preview{block="{'type':'variable_get','fields':{'VAR':{'id':'age','name':'Alter','type':'Number'},'TYPE':{'type':'Number'}}}"}

#### Spalten-Variable :anchor{id="column-variable"} :blockinfo{type="variable_get_column"}

Diese besondere Variable ermöglicht es, auf alle Werte einer Spalte in Form einer Liste zuzugreifen. Das ist zum Beispiel nützlich, um einen Durchschnittswert zu berechnen. Diese Variable hat den Namen "Spalte xxx", wobei xxx der Name der ausgewählten Spalte ist.

Durch einen Klick auf den Variablennamen wird eine Liste aller Spaltennamen angezeigt, die dann ausgewählt werden können.

::block-preview{block="{'type': 'variable_get_column'}"}

### Eingabe von Werten
In die meisten Blöcke können Werte direkt eingegeben werden. Welchen Typ der Wert haben muss, wird durch den Block und die anderen Eingabefelder bestimmt. Wenn zum Beispiel eine Variable vom Typ `Zahl` in den :inline-block-preview{block="{'type': 'comparison_equals'}" text="Gleichheits-Block"} eingefügt wird, werden in allen Eingabefeldern nur Zahlen akzeptiert.

:::info-box{type="note"}
Auch wenn ein Block :inline-block-preview{block="{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}},'extraState':{'inputTypes':{'A':'*?','B':'*?'},'originalTypes':{'A':'*?','B':'*?','DELTA':'Number?','C':'Union<Number | Timestamp>?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}" text="schon Eingabefelder hat"}, aber keine Variable oder kein anderer Block vorhanden ist, der den Typ bestimmt, kann der Typ durch das andocken eines Blocks im Eingabefeld bestimmt werden.
:::

#### Eingabe von Texten
Texte können beliebig lang sein und können auch Leerzeichen und Sonderzeichen enthalten.

#### Eingabe von Zahlen
Zahlen können als Ganzzahl oder als Dezimalzahl eingegeben werden.
Große Zahlen können alternativ in wissenschaftlicher Notation eingegeben werden, z.B. `1.23e6` für 1.23 Millionen.

:::info-box{type="warning"}
Dezimalzahlen werden mit Punkt `.` getrennt. Zum Beispiel wird die Zahl 3,14 als `3.14` eingegeben.
:::

#### Eingabe von Listen
Listen können beliebig viele Werte eines bestimmten Typs enthalten.

::block-preview{block="{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'list_immediate','inputs':{'VALUE_hn`kA6=k9l0Lwvt:3Tmk':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'20'}}}},'VALUE_gl#V(yo38s{-4KzA]]mL':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'30'}}}},'VALUE_oNb#Yb;vIC?45!@Ba@qr':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'40'}}}}},'extraState':{'variableType':'List<Number>?','inputs':[{'name':'VALUE_hn`kA6=k9l0Lwvt:3Tmk','shadow':{'type':'math_number','id':'4xGyK8m!29Ps6/u-/6X!','fields':{'NUM':'20'}}},{'name':'VALUE_gl#V(yo38s{-4KzA]]mL','shadow':{'type':'math_number','id':'s[LTQ4;uH_x#1al$M,w*','fields':{'NUM':'30'}}},{'name':'VALUE_oNb#Yb;vIC?45!@Ba@qr','shadow':{'type':'math_number','id':'k|0DbFX]+E0C2Kn(0MM4','fields':{'NUM':'40'}}}]}}},'B':{'shadow':{'type':'list_immediate','inputs':{'VALUE_8iWqj4tP|s,+q[2^Hs^H':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}},'extraState':{'variableType':'List<Number>?','inputs':[{'name':'VALUE_8iWqj4tP|s,+q[2^Hs^H','shadow':{'type':'math_number','id':',L6(?(Tw]v[$Y*D8groD','fields':{'NUM':''}}}]}}}},'extraState':{'inputTypes':{'A':'*?','B':'*?'},'originalTypes':{'A':'*?','B':'*?','DELTA':'Number?','C':'Union<Number | Timestamp>?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}"}

Im Beispiel oben wurde eine Liste mit den Werten 20, 30 und 40 erstellt. Ein neues Element kann hinzugefügt werden, indem das `+` Symbol am Ende der Liste angeklickt wird. Werte können durch anklicken des Wertes und anschließendes klicken des `-` Symbols entfernt werden. Alternativ kann man diese Funktionen auch durch betätigen der `Backspace` bzw. `Tab` Taste ausführen.
Mit den Pfeiltasten kann man sich durch die Liste bewegen.

Eine Liste beinhaltet immer mindestens ein Element.

#### Eingabe von Strukturen
Strukturen bestehen aus Schlüssel-Wert-Paaren. Jedes Paar besteht aus einem Schlüssel und einem Wert. Der Schlüssel ist ein Text, der den Wert beschreibt. Der Wert kann ein beliebiger Typ sein.

::block-preview{block="{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'struct_select','extraState':{'variableType':'{Name: Enum<StationsName>, Inbetriebnahme: Timestamp}?','inputs':[]}}},'B':{'shadow':{'type':'struct_select','inputs':{'PROPERTY_wh)@-K3m^Ot)mWMd`UJ:':{'shadow':{'type':'enum_select','fields':{'ENUM':{'value':'Augsburg'}},'extraState':{'variableType':'Enum<StationsName>'}}}},'extraState':{'variableType':'{Name: Enum<StationsName>, Inbetriebnahme: Timestamp}?','inputs':[{'name':'PROPERTY_wh)@-K3m^Ot)mWMd`UJ:','propertyName':'Name','shadow':{'type':'enum_select','id':'ha9r#WWkRWIz{gj@xkd?','extraState':{'variableType':'Enum<StationsName>'},'fields':{'ENUM':'Augsburg'}}}]}}}},'extraState':{'inputTypes':{'A':'*?','B':'*?'},'originalTypes':{'A':'*?','B':'*?','DELTA':'Number?','C':'Union<Number | Timestamp>?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}"}

Im Beispiel oben wurde eine Struktur mit Attribut `Name` = "Augsburg" erstellt. Ein weiteres Attribut kann hinzugefügt werden, indem das `+` Symbol am Ende der Struktur angeklickt wird. Attribute können durch anklicken des Attributs und anschließendes klicken des `-` Symbols entfernt werden. Alternativ kann man diese Funktionen auch durch betätigen der `Backspace` bzw. `Tab` Taste ausführen.

#### Eingabe von Hierarchien
Um einen Wert aus einer Hierarchie auszuwählen kann man entweder direkt den Code eingeben oder jede Hierarchiestufe in dem sich öffnenden Dropdown-Menü auswählen.
Durch klicken auf das `+` Symbol wird eine neue Hierarchiestufe hinzugefügt. Durch klicken auf das `-` Symbol wird die Hierarchiestufe und alle darunterliegenden Stufen entfernt.

#### Eingabe von Datums- und Zeitwerten :anchor{id="date-time-input"}
Datum- und Zeitwerte können als Text eingegeben werden. Die Eingabe wird automatisch in das korrekte Format umgewandelt.
Gültige Eingabeformate sind:

-   `YYYY-MM-DD` für Datumswerte
-   `YYYY-MM-DD HH:MM:SS` für Datum- und Uhrzeitwerte
-   `HH:MM:SS YYYY-MM-DD` für Datum- und Uhrzeitwerte
-   `DD.MM.YYYY` für Datumswerte im deutschen Format
-   `DD.MM.YYYY HH:MM:SS` für Datum- und Uhrzeitwerte im deutschen Format
-   `HH:MM:SS DD.MM.YYYY` für Datum- und Uhrzeitwerte im deutschen Format

Alternativ kann das Datum auch im erscheinden Dropdown ausgeählt werden. Durch klicken auf das `+` Symbol wird eine neue Einheit hinzugefügt. Durch klicken auf das `-` Symbol wird die Einheit und alle darunterliegenden Einheiten entfernt.

Jede Einheit kann auch durch die Option `any` ersetzt werden, um alle möglichen Werte in dieser Einheit zu akzeptieren.
So kann man zum Beispiel mit `01.*.2021` immer den ersten Tag eines Monats im Jahr 2021 auswählen.

## Blocks

### Knoten-Blöcke

Knoten-Blöcke bieten die Möglichkeit, die Kohorte zu erstellen und zu speichern. Jeder Knoten-Block hat einen oder mehrere Verbindungspunkte, um die Blöcke miteinander zu verbinden.
Verbindungspunkte auf der linken Seite sind Eingabepunkte, Verbindungspunkte auf der rechten Seite sind Ausgabepunkte. Eingabe- und Ausgabepunkte können durch Anklicken miteinander verbunden werden. An jedem Verbindungspunkt können mehrere Verbindungslinien (Kanten) angeschlossen werden.

#### Quell-Block :anchor{id="source-node"} :blockinfo{type="source_node"}

Der Quell-Block ist der Startpunkt für die Kohorte. Dieser Block hat einen Ausgabepunkt, um die Kohorte an den nächsten Block zu übergeben.
Es kann pro Arbeitsbereich nur einen Quell-Block geben.

::block-preview{block="{'type': 'source_node'}"}

#### Ziel-Block :anchor{id="target-node"} :blockinfo{type="target_node"}

Der Ziel-Block ist der Endpunkt für die Kohorte. Dieser Block hat einen Eingabepunkt, um die Kohorte von den vorherigen Blöcken zu empfangen.
Es kann mehrere Ziel-Blöcke pro Arbeitsbereich geben, diese haben unterschiedliche Namen. Jeder dieser Ziel-Blöcke kann nur einmal pro Arbeitsbereich verwendet werden.

Der Ziel-Block im Beispiel unten ist mit dem Namen "Ziel" benannt.

::block-preview{block="{'type': 'target_node'}"}

#### Filter-Block :anchor{id="subset-node"} :blockinfo{type="subset_node"}

Der Filter-Block wird verwendet, um die Kohorte zu filtern. Dieser Block hat einen Eingabepunkt, um die Kohorte von den vorherigen Blöcken zu empfangen. Es gibt zwei Ausgabepunkte, um die gefilterte Kohorte an die nächsten Blöcke zu übergeben:

-   **Positiv**: Die Entität (z.B. der Patient) erfüllt die Filterbedingung.
-   **Negativ**: Die Entität (z.B. der Patient) erfüllt die Filterbedingung nicht.

Es können beliebig viele Filter Blöcke pro Arbeitsbereich verwendet Werden. Der Name kann frei gewählt werden, mehrere Filter Blöcke können den gleichen Namen haben.

Um die Filterbedingung zu definieren, können aus dem Werkzeugkasten auf der linken Seite :inline-block-preview{block="{'type':'subset_node','fields':{'NAME':{'value':'Demo'},'INPUT':{'value':'Input'},'POSITIVE':{'value':'Positive'},'NEGATIVE':{'value':'Negative'}},'inputs':{'FILTERS':{'block':{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'yW^*w8kATP,-Dq[65n:h','name':'Alter','type':'Number'},'TYPE':{'type':'Number'}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'18'}}}}}}}}}" text="einen"} oder :inline-block-preview{block="{'type':'subset_node','fields':{'NAME':{'value':'Demo'},'INPUT':{'value':'Eingabe'},'POSITIVE':{'value':'Positiv'},'NEGATIVE':{'value':'Negativ'}},'inputs':{'FILTERS':{'block':{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'4;3@)Vaz+Y|eS-kzp:%Q','name':'Alter','type':'Number'},'TYPE':{'type':'Number'}},'extraState':{'variable':'Number'}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'18'}}}}},'extraState':{'inputTypes':{'A':'Number?','B':'Number?'},'originalTypes':{'A':'*?','B':'*?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}},'next':{'block':{'type':'comparison_equals','extraState':{'inputTypes':{'A':'Number?','B':'Number?'},'originalTypes':{'A':'*?','B':'*?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}}}}}}" text="mehrere"} Vergleichsblöcke (z.B. einen [:inline-block-preview{block="{'type': 'comparison_equals'}" text="Gleichheits-Block"}](#equals)) auf den Arbeitsbereich gezogen werden. Diese können dann in den Filter-Block gezogen werden. Alle so platzierten Vergleichs-Blöcke werden mit einem logischen `UND` verknüpft.

Der Filter-Block im Beispiel unten ist mit dem Namen "Test" benannt.

::block-preview{block="{'type':'subset_node','fields':{'NAME':{'value':'Test'}}}"}

#### Mengenarithmetik-Block :anchor{id="set-arithmetic-node"} :blockinfo{type="set_arithmetic_node"}

Der Mengenarithmetik-Block wird verwendet, um Mengenoperationen wie `UND`, `ODER` und `NICHT` auf die Kohorte anzuwenden. Dieser Block hat zwei Eingabepunkte "Links" und "Rechts" und einen Ausgabepunkt "Ergebnis".

Durch das Schaubild in der Mitte (Venn-Diagramm) können die Mengenoperationen visuell nachvollzogen werden. Durch Klicken auf die jeweiligen Bereiche werden die Mengenoperationen ausgewählt.

Im Beispiel unten ist die Mengenoperation `ODER` ausgewählt, was einer Vereinigung entspricht.

::block-preview{block="{'type': 'set_arithmetic_node'}"}

### Vergleichs-Blöcke

Vergleichs-Blöcke werden verwendet, um Filterbedingungen zu definieren. Die Filterbedingungen können auf den Variablen basieren, die in den Datenbanktabellen verfügbar sind. Die Vergleichs-Blöcke haben ein oder mehrere Eingabefelder, in denen Variablen oder andere Blöcke vom passenden Typ platziert werden können.

#### Gleichheits-Block :anchor{id="equals"} :blockinfo{type="comparison_equals"}

Der Gleichheits-Block wird verwendet, um zu überprüfen, ob zwei Werte gleich sind. Dazu werden die zu vergleichenden Werte in die beiden Eingabefelder eingetragen. Der Block gibt `wahr` zurück, wenn die Werte gleich sind, andernfalls `falsch`.

-   Im Fall von Textdaten wird die Groß- und Kleinschreibung berücksichtigt.
-   Im Fall von Strukturdaten müssen die Strukturen sowie die Werte in den Strukturen übereinstimmen.
-   Im Fall von Listen wird überprüft, ob die Listen die gleichen Werte in der gleichen Reihenfolge enthalten.
-   Im Fall von Hierarchien wird überprüft, ob die beiden Werte in der Hierarchie gleich sind, zum Beispiel ob zwei ICD10 Codes exakt gleich sind:

    E14.0 _gleich_ E14.0, aber E14.0 _ungleich_ E14.01.

::block-preview{block="{'type': 'comparison_equals'}"}

Im folgenden Beispiel wird überprüft, ob das Alter exakt 65 ist:
::block-preview{block="{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'0d?jigrXQV]7.tSRK/X8','name':'Alter','type':'Number'},'TYPE':{'type':'Number'}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'65'}}}}}}"}

:::info-box{type="tip"}
Um eine Ungleichheit zu überprüfen, kann der Gleichheits-Block in Verbindung mit einem [:inline-block-preview{block="{'type':'logic_not','inputs':{'STATEMENTS':{'block':{'type':'comparison_equals'}}}}" text="Negations-Block"}](#logic-not) verwendet werden.
:::

#### Entspricht-Block :anchor{id="matches"} :blockinfo{type="comparison_matches"}

Der Entspricht-Block wird verwendet, um zu überprüfen, ob ein Wert einem allgemeineren Wert entspricht. Der Block hat zwei Eingabefelder, das linke Feld beinhaltet den konkreteren Wert, z.B. eine Struktur mit einer Adresse `{Stadt: "Berlin", Straße: "Karl-Marx-Allee"}` und das rechte Feld beinhaltet den allgemeineren Wert, z.B. eine Struktur mit einer Stadt `{Stadt: "Berlin"}`. Der Block gibt `wahr` zurück, wenn der konkretere Wert dem allgemeineren Wert entspricht, andernfalls `falsch`.

-   Im Fall von Strukturdaten kann der konkretere Wert zusätzliche Felder enthalten, die nicht im allgemeineren Wert enthalten sind.
-   Im Fall von Hierarchien wird überprüft, ob der konkretere Wert in der Hierarchie enthalten ist, zum Beispiel ob der ICD10 Code E14.0 dem allgemeineren Code E14 entspricht.

::block-preview{block="{'type': 'comparison_matches'}"}

#### Gleichheits-Block mit Toleranz :anchor{id="equals-within"} :blockinfo{type="comparison_equals_within"}

Der Gleichheits-Block mit Toleranz wird verwendet, um zu überprüfen, ob zwei Werte innerhalb einer Toleranzgrenze gleich sind. Der Block hat drei Eingabefelder, um die Werte zu vergleichen und die Toleranzgrenze festzulegen. Der Block gibt `wahr` zurück, wenn die Werte innerhalb der Toleranzgrenze gleich sind, andernfalls `falsch`.

In alle Felder können nur Zahlen eingegeben werden, bzw. Variablen, die Zahlen enthalten.

::block-preview{block="{'type':'comparison_equals_within','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'DELTA':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

#### Vergleichs-Blöcke für Zahlen :anchor{id="comparison-numbers"} :blockinfo{type="comparison_greater"}

Für Zahlen gibt es spezielle Vergleichs-Blöcke, die auf numerischen Werten basieren. Diese Blöcke haben ein oder mehrere Eingabefelder, in denen Zahlen oder andere Blöcke vom Typ `Zahl` platziert werden können.

Es stehen folgende Vergleichs-Blöcke für Zahlen zur Verfügung:

-   :inline-block-preview{block="{'type':'comparison_greater','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Größer-Block"}
-   :inline-block-preview{block="{'type':'comparison_greater_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Größer-oder-Gleich-Block"}
-   :inline-block-preview{block="{'type':'comparison_less','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Kleiner-Block"}
-   :inline-block-preview{block="{'type':'comparison_less_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Kleiner-oder-Gleich-Block"}

#### Vergleichs-Block für Intervalle :anchor{id="comparison-interval"} :blockinfo{type="comparison_interval"}

Als Abkürzung für `A > B UND A < C` gibt es den Intervall-Block. Der Block hat drei Eingabefelder, um den Wert A und die Grenzen B und C des Intervalls zu vergleichen. Der Block gibt `wahr` zurück, wenn der Wert A innerhalb des Intervalls liegt, andernfalls `falsch`.

In alle Felder können nur Zahlen eingegeben werden, bzw. Variablen, die Zahlen enthalten.

::block-preview{block="{'type':'comparison_interval','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'C':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

#### Vergleichs-Block für ungültige Werte :anchor{id="comparison-null"} :blockinfo{type="comparison_null"}

Der Vergleichs-Block für ungültige Werte prüft, ob ein Wert ungültig ist. Der Block hat ein Eingabefeld, in dem der zu prüfende Wert platziert wird. Der Block gibt `wahr` zurück, wenn der Wert ungültig ist, andernfalls `falsch`.

Dieser Block wird in der Werkzeugleiste nur angezeigt, wenn in der Datenbank ungültige Werte vorhanden sind.

::block-preview{block="{'type': 'comparison_null'}"}

Um zu überprüfen, ob ein Wert gültig ist, kann der Vergleichs-Block für ungültige Werte in Verbindung mit einem [:inline-block-preview{block="{'type':'logic_not','inputs':{'STATEMENTS':{'block':{'type':'comparison_null'}}}}" text="Negations-Block"}](#logic-not) verwendet werden.

### Mathe-Blöcke

Mathe-Blöcke werden verwendet, um mathematische Operationen auf Zahlen anzuwenden. Die Mathe-Blöcke haben ein oder mehrere Eingabefelder, in denen Zahlen oder andere Blöcke vom Typ `Zahl` platziert werden können. Sie selbst geben ebenfalls Zahlenwerte aus.

#### Grundrechenarten :anchor{id="math-operations"} :blockinfo{type="math_add"}

Es stehen folgende Mathe-Blöcke zur Verfügung:

-   :inline-block-preview{block="{'type':'math_add','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Additions-Block"}
-   :inline-block-preview{block="{'type':'math_subtract','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Subtraktions-Block"}
-   :inline-block-preview{block="{'type':'math_multiply','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Multiplikations-Block"}
-   :inline-block-preview{block="{'type':'math_divide','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}" text="Divisions-Block"}

Im folgenden Beispiel wird der BMI berechnet, indem das Gewicht durch das Quadrat der Größe geteilt wird: :anchor{id="calculation-example"}

::block-preview{block="{'type':'math_divide','inputs':{'A':{'block':{'type':'variable_get','fields':{'VAR':{'id':'weight','name':'Gewicht','type':'Number'},'TYPE':{'type':'Number'}}}},'B':{'block':{'type':'math_multiply','inputs':{'A':{'block':{'type':'variable_get','fields':{'VAR':{'id':'size','name':'Größe','type':'Number'},'TYPE':{'type':'Number'}}}},'B':{'block':{'type':'variable_get','fields':{'VAR':{'id':'size','name':'Größe','type':'Number'},'TYPE':{'type':'Number'}}}}}}}}}"}


#### Binäre Operationen :anchor{id="math-binary-operations"} :blockinfo{type="math_binary"}
Mit diesem Block können mathematische Operationen auf zwei Zahlen ausgeführt werden. Der Block hat zwei Eingabefelder, in denen Zahlen oder andere Blöcke vom Typ `Zahl` platziert werden können. Den Operator kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'math_binary','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

Folgende Operationen stehen zur Verfügung:
| Operator | Beschreibung |
|----------|--------------|
| `+` | Addition |
| `-` | Subtraktion |
| `×` | Multiplikation |
| `/` | Division |
| `^` | Potenz |
| `%` | Modulo |

Mit diesem Block kann das [Berechnungsbeispiel für den BMI](#calculation-example) von oben auch wie folgt durchgeführt werden:

::block-preview{block="{'type':'math_divide','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'mURUyO-m.dkfG_#d2V0}','name':'Gewicht','type':'Number'},'TYPE':{'type':'Number'}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'math_binary','fields':{'OP':{'value':'POWER'}},'inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'mURUyO-m.dkfG_#d2V0}','name':'Größe','type':'Number'},'TYPE':{'type':'Number'}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'2'}}}}}}}}}"}


#### Funktionen :anchor{id="math-functions"} :blockinfo{type="math_unary"}
Dieser Block wendet eine mathematische Funktion auf einen Wert an. Der Block hat ein Eingabefeld, in dem eine Zahl oder ein anderer Block vom Typ `Zahl` platziert werden kann. Die Funktion kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'math_unary','inputs':{'NUM':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

Folgende Funktionen stehen zur Verfügung:
| Funktion | Beschreibung |
|----------|--------------|
| `sin` | Sinus |
| `cos` | Cosinus |
| `tan` | Tangens |
| `asin` | Arcussinus |
| `acos` | Arcuscosinus |
| `atan` | Arcustangens |
| `e ^` | Exponentialfunktion |
| `ln` | Natürlicher Logarithmus |
| `Betrag` | Absolutbetrag |
| `sqrt` | Quadratwurzel |
| `Runde` | Runden |
| `Runde ab` | Abrunden |
| `Runde auf` | Aufrunden |

#### Konstanten :anchor{id="math-constants"} :blockinfo{type="math_constants"}
Dieser Block gibt eine mathematische Konstante zurück. Der Block hat kein Eingabefeld, die Konstante kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'math_constant'}"}

Folgende Konstanten stehen zur Verfügung:
| Konstante | Beschreibung | Wert |
|-----------|--------------|------|
| `π` | Kreiszahl Pi | 3.141592... |
| `e` | Euler'sche Zahl | 2.718281... |
| `φ` | Goldener Schnitt | 1.618033... |
| `∞` | Unendlich | ∞ |

#### Einschränkungen :anchor{id="math-constrain"} :blockinfo{type="math_constrain"}
Dieser Block schränkt eine Zahl auf einen Bereich ein. Der Block hat drei Eingabefelder, in denen eine Zahl oder ein anderer Block vom Typ `Zahl` platziert werden kann. Der erste Wert ist der zu prüfende Wert, der zweite Wert ist der untere Grenzwert und der dritte Wert ist der obere Grenzwert. Der Block gibt eine Zahl zurück, die innerhalb dieses Bereichs liegt. Wenn der Wert über der oberen Grenze liegt, wird der Wert der oberen Grenze zurückgegeben. Liegt er unterhalb der unteren Grenze, wird der Wert der unteren Grenze zurückgegeben. Liegt der Wert innerhalb der Grenzen, wird dieser selbst zurückgegeben.

::block-preview{block="{'type':'math_constrain','inputs':{'NUM':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'LOW':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'HIGH':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

#### Zahleneigenschaften :anchor{id="math-properties"} :blockinfo{type="math_number_property"}
Dieser Block prüft eine Zahl auf die ausgewählte Eigenschaft und gibt `wahr` zurück, wenn die Eigenschaft zutrifft, andernfalls `falsch`. Die Eigenschaft kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'math_number_property','fields':{'PROPERTY':{'value':'EVEN'}},'inputs':{'NUM':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

Wenn die Eigenschaft `teilbar durch` ausgewählt wird, erscheint ein weiteres Eingabefeld, in dem der Divisor eingegeben werden kann.

::block-preview{block="{'type':'math_number_property','fields':{'PROPERTY':{'value':'DIVISIBLE_BY'}},'inputs':{'NUM':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'DIVISOR':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

Folgende Eigenschaften stehen zur Verfügung:
| Eigenschaft | Beschreibung |
|-------------|--------------|
| `gerade` | Die Zahl ist gerade |
| `ungerade` | Die Zahl ist ungerade |
| `positiv` | Die Zahl ist positiv |
| `negativ` | Die Zahl ist negativ |
| `eine Primzahl` | Die Zahl ist eine Primzahl |
| `eine Ganzzahl` | Die Zahl ist ganzzahlig |
| `eine Dezimalzahl` | Die Zahl ist dezimal |
| `teilbar durch` | Die Zahl ist durch den Divisor teilbar |

:::info-box{type="warning"}
Die Eigenschaft `eine Primzahl` ist rechenintensiv für große Zahlen und kann zu einer langen Berechnungszeit führen.
:::

### List- and Structure-Blocks
#### Listen Erstellen :anchor{id="list-create"}
Beim Listen-Block kann in einem Eingabefeld eine Variable ausgewählt werden, in dem anderen Eingabefeld  kann eine weitere Variable ausgewählt oder eine Liste von Werten eingeben werden.

::block-preview{block="{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'list_immediate','inputs':{'VALUE_BTA%BRZUG5dP|pHU{P|]':{'shadow':{'type':'string_immediate','fields':{'VALUE':{'value':''}},'extraState':{'variableType':'String'}}}},'extraState':{'variableType':'List<String>?','inputs':[{'name':'VALUE_BTA%BRZUG5dP|pHU{P|]','shadow':{'type':'string_immediate','id':'(S4^GNn|r/DAK6cM4lY4','extraState':{'variableType':'String'},'fields':{'VALUE':''}}}]}},'block':{'type':'variable_get','fields':{'VAR':{'id':'H$cp+e~f4vm31NWJxxqL','name':'Freunde','type':'List<String>'},'TYPE':{'type':'List<String>'}},'extraState':{'variable':'List<String>'}}},'B':{'shadow':{'type':'list_immediate','inputs':{'VALUE_;_gwarge}^P,[Yk+q7:5':{'shadow':{'type':'string_immediate','fields':{'VALUE':{'value':'Alice'}},'extraState':{'variableType':'String'}}},'VALUE_h*,/d$=?V(%uu=i,`3^?':{'shadow':{'type':'string_immediate','fields':{'VALUE':{'value':'Bob'}},'extraState':{'variableType':'String'}}}},'extraState':{'variableType':'List<String>?','inputs':[{'name':'VALUE_;_gwarge}^P,[Yk+q7:5','shadow':{'type':'string_immediate','id':'4Ke|qV|LXudq_sP+9Jbp','extraState':{'variableType':'String'},'fields':{'VALUE':'Alice'}}},{'name':'VALUE_h*,/d$=?V(%uu=i,`3^?','shadow':{'type':'string_immediate','id':'0:;Do(6#HI5*`S$,$Br^','extraState':{'variableType':'String'},'fields':{'VALUE':'Bob'}}}]}}}},'extraState':{'inputTypes':{'A':'List<String>?','B':'List<String>?'},'originalTypes':{'A':'*?','B':'*?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}"}

#### Listenoperationen :anchor{id="list-operations"} :blockinfo{type="list_math"}
Dieser Block wendet mathematische Operationen auf eine Liste an und gibt eine Zahl aus. Der Block hat ein Eingabefeld, in dem eine Liste von Zahlen oder ein anderer Block vom Typ `Liste` platziert werden kann. Die Operation kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'list_math','fields':{'OP':{'value':'SUM'}}}"}

Folgende Operationen stehen zur Verfügung:
| Operation | Beschreibung |
|-----------|--------------|
| `Summe` | Summe |
| `Durschnitt` | Durchschnitt (Arithmetisches Mittel) |
| `Standardabweichung` | Standardabweichung |
| `Minimum` | Minimum |
| `Q1` | 1. Quartil |
| `Median` | Median bzw. 2. Quartil |
| `Q3` | 3. Quartil |
| `Maximum` | Maximum |
| `Modus` | Modus|
| `Varianz` | Varianz |
| `Spannweite` | Spannweite (Maximum - Minimum) |
| `IQR` | Interquartilsabstand (Q3 - Q1) |
| `Anzahl` | Anzahl der Elemente |

#### Listen Vereinigen :anchor{id="list-flatten"} :blockinfo{type="list_flatten"}
Dieser Block vereinigt mehrere Listen zu einer einzigen Liste. Der Block hat ein Eingabefeld, in dem eine Liste von Listen platziert werden kann.

::block-preview{block="{'type':'list_flatten'}"}

#### Listenlänge :anchor{id="list-length"} :blockinfo{type="list_length"}
Dieser Block gibt die Anzahl der Elemente in einer Liste zurück. Der Block hat ein Eingabefeld, in welchem eine Liste oder ein anderer Block vom Typ `Liste` platziert werden kann.

::block-preview{block="{'type':'list_length'}"}

Für Listen von Zahlen kann die Anzahl der Elemente auch mit dem [:inline-block-preview{block="{'type':'list_math','fields':{'OP':{'value':'COUNT'}}}" text="Listenoperations-Block"}](#list-operations) und der Operation `count` berechnet werden.

#### Liste Beinhaltet :anchor{id="list-contains"} :blockinfo{type="list_contains"}
Dieser Block prüft, ob ein Wert in einer Liste enthalten ist und gibt `wahr` zurück, wenn der Wert in der Liste enthalten ist, andernfalls `falsch`. Der Block hat zwei Eingabefelder, in denen eine Liste und ein Wert oder andere Blöcke vom Typ `Liste` bzw. `Beliebig` platziert werden können. Sobald einer der beiden Werte eingegeben wird, wird der Typ des anderen Feldes automatisch angepasst. 

:::info-box{type="tip"}
Die verwendete Vergleichsoperation ist dieselbe wie beim [Gleichheits-Block](#equals). Um komplexere Bedingungen festzulegen, kann der [:inline-block-preview{block="{'type':'list_any_all','fields':{'OP':{'value':'ANY'},'VALUE':{'value':'Wert'}},'inputs':{'QUERY':{'block':{'type':'comparison_matches'}}}}" text="Listenquantifizierungs-Block"}](#list-any-all) verwendet werden.
:::

::block-preview{block="{'type':'list_contains'}"}

#### Listengleichheit :anchor{id="list-equals"} :blockinfo{type="list_equals"}
Dieser Block prüft zwei Listen auf Gleichheit und gibt `wahr` zurück, wenn die Listen gleich sind, andernfalls `falsch`. Der Block hat zwei Eingabefelder, in denen zwei Listen oder andere Blöcke vom Typ `Liste` platziert werden können.

::block-preview{block="{'type':'list_equals','fields':{'OP':{'value':'EQUALS'}}}"}

Neben dem Vergleich auf Gleichheit gibt es noch folgende Operationen:

| Operation | Beschreibung |
|-----------|--------------|
| `gleich` | Beide Listen beinhalten die gleichen Elemente in der gleichen Reihenfolge |
| `enthält Folge` | Die erste Liste beinhaltet die zweite Liste als Teilfolge |
| `beginnt mit Folge` | Die erste Liste beginnt mit der zweiten Liste |
| `endet mit Folge` | Die erste Liste endet mit der zweiten Liste |
| `behinhaltet alle Elemente von` | Die erste Liste beinhaltet alle Elemente der zweiten Liste in beliebiger Reihenfolge, die erste Liste kann auch noch weitere Elemente beinhalten |


#### Listenquantifizierung :anchor{id="list-any-all"} :blockinfo{type="list_any_all"}
Dieser Block prüft, ob eine Bedingung für alle oder mindestens ein Element einer Liste zutrifft. Der Block hat ein Eingabefeld, in dem eine Liste platziert werden kann. Es gibt eine sogenannte lokale Variable mit dem Namen `Wert` die in der Bedingung verwendet werden kann. Diese Variable beinhaltet den Wert des aktuellen Elements der Liste.

Die Bedingung kann aus beliebigen Vergleichsblöcken bestehen, die alle mit einem logischen `UND` verknüpft werden.

::block-preview{block="{'type':'list_any_all','fields':{'OP':{'value':'ANY'},'VALUE':{'value':'Wert'}}}"}

Folgende Quantoren stehen zur Verfügung:
| Quantor | Beschreibung |
|---------|--------------|
| `jeden` | Die Bedingung muss für alle Elemente der Liste zutreffen |
| `irgendeinen` | Die Bedingung muss für mindestens ein Element der Liste zutreffen |

:::info-box{type="warning"}
Die lokale Variable `Wert` kann nur innerhalb des Listenquantifizierungsblocks verwendet werden. Wenn diese Variable außerhalb des Blocks losgelassen wird, verschwindet sie von der Arbeitsfläche.
:::


#### Structure-Attribute Block :anchor{id="struct-get"} :blockinfo{type="struct_get_property"}
This block returns the value of an attribute of a structure. The block has an input field where a structure or another block of type `Structure` can be placed. The attribute can be selected from a dropdown list. Once a structure is entered, the available attributes are automatically displayed.

::block-preview{block="{'type':'struct_get_property','fields':{'PROPERTY':{'value':'NAME'}}}"}

:::info-box{type="warning"}
**Note**: The structure attribute block can only be connected to other blocks once a structure has been entered into the input field. Only then will the available attributes be displayed and can be selected, allowing an output type to be set.
:::

In the following example, the attribute `Street` of the structure `Address` is selected:

::block-preview{block="{'type':'struct_get_property','fields':{'PROPERTY':{'value':'street'}},'inputs':{'STRUCT':{'block':{'type':'variable_get','fields':{'VAR':{'id':'+bFZ?Z[vk(-{[Ye[$M7d','name':'address','type':'{street: String}'},'TYPE':{'type':'{street: String}'}},'extraState':{'variable':'{street: String}'}}}},'extraState':{'variableType':'{street: String}'}}"}

:::info-box{type="tip"}
This block can also be applied to a list of structures. In the address example, it would return a list containing all the streets of the addresses.
:::
### Logic-Blocks
Standardmäßig werden Blöcke, die eine Bedingung prüfen, mit einem logischen `UND` verknüpft. Um komplexere Bedingungen zu erstellen, können die Blöcke mit einem logischen `ODER` oder `NICHT` verknüpft werden, dies wird durch die Verwendung von Logik-Blöcken erreicht.

#### Negations-Block :anchor{id="logic-not"} :blockinfo{type="logic_not"}
Der Negations-Block wird verwendet, um eine Bedingung zu negieren. Eine oder mehrere Bedingungen können innerhalb des Negations-Blocks platziert werden. Der Block gibt `wahr` zurück, wenn mindestens eine der Bedingungen `falsch` ist, andernfalls `falsch`. Alle Bedingungen innerhalb des Negationsblocks werden mit einem logischen `UND` verknüpft.

::block-preview{block="{'type':'logic_not'}"}

#### Entweder-Oder-Block :anchor{id="logic-or"} :blockinfo{type="logic_or"}
Der Entweder-Oder-Block wird verwendet, um zwei oder mehr Bedingungen zu verknüpfen. Die Bedingungen können innerhalb des Entweder-Oder-Block platziert werden. Bedingungen innerhalb eines `Oder`-Zweigs werden mit einem logischen `UND` verknüpft. Es gibt zwei Buttons, um weitere `Oder`-Zweige hinzuzufügen, bzw. zu entfernen.

::block-preview{block="{'type':'logic_or'}"}

Es können beliebig viele Bedingungen hinzugefügt werden.

In dem folgenden Beispiel wird überprüft, ob das Alter zwischen 0 und 18 oder zwischen 65 und 100 liegt, oder ob die Person die Zustimmung zur Teilnahme verweigert hat:

::block-preview{block="{'type':'logic_or','inputs':{'OR_STATEMENT_0':{'block':{'type':'comparison_equals','inputs':{'A':{'block':{'type':'variable_get','fields':{'VAR':{'id':'unCdFt!8:to#L+TANU4^','name':'Zustimmung','type':'Boolean'},'TYPE':{'type':'Boolean'}},'extraState':{'variable':'Boolean'}}},'B':{'shadow':{'type':'logic_boolean','fields':{'BOOL':{'value':'FALSE'}}}}},'extraState':{'inputTypes':{'A':'Boolean?','B':'Boolean?'},'originalTypes':{'A':'*?','B':'*?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}},'OR_STATEMENT_1':{'block':{'type':'comparison_interval','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'Q{Ttx^1-cBWL6=2mV6/m','name':'Alter','type':'Number'},'TYPE':{'type':'Number'}},'extraState':{'variable':'Number'}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'0'}}}},'C':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'18'}}}}}}},'OR_STATEMENT_e%pUPLAI[viQh?B*;[*.':{'block':{'type':'comparison_interval','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}},'block':{'type':'variable_get','fields':{'VAR':{'id':'Q{Ttx^1-cBWL6=2mV6/m','name':'Alter','type':'Number'},'TYPE':{'type':'Number'}},'extraState':{'variable':'Number'}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'65'}}}},'C':{'shadow':{'type':'math_number','fields':{'NUM':{'value':'100'}}}}}}}},'extraState':{'inputNames':['e%pUPLAI[viQh?B*;[*.']}}"}

Dieses Beispiel wird ausgewertet zu 

```
     (Zustimmung = falsch) 
ODER (Alter > 0 UND Alter < 18) 
ODER (Alter > 65 UND Alter < 100)
```

### Zeitleisten-Blöcke :anchor{id="timeline-blocks"}

#### Timeline Match Block :anchor{id="timeline-match"} :blockinfo{type="timeline_query"}
Um eine Zeitleiste mit einem `Template` zu vergleichen wird der [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet. Dieser Block hat ein Eingabefeld, in das ein Block vom Typ `Zeitleiste` platziert wird. Der Block gibt `wahr` zurück, wenn die Zeitleiste mit dem Template übereinstimmt, andernfalls `falsch`.

Das Template kann durch Platzieren von Template-Blöcken in den Timeline Match Block erstellt werden.
:::info-box{type="warning"}
**Hinweis:** Die Form der internen Verbindungspunkte ist unterschiedlich zu den Vergleichsblöcken. Somit können Template-Blöcke und Vergleichs-Blöcke nicht direkt miteinander verbunden werden.
:::

::block-preview{block="{'type':'timeline_query'}"}

Im folgenden Beispiel ist eine einfache Zeitleiste gezeigt, in der ein Ereignis `U1` nach dem 01.01.2020 vorkommt:

::block-preview{block="{'type':'timeline_query','inputs':{'TIMELINE':{'block':{'type':'variable_get','fields':{'VAR':{'id':'y}.!6d$nLL]x12yUWtmX','name':'Untersuchungen','type':'Timeline<{timestamp: Timestamp, type: Enum<*>, name: String}>'},'TYPE':{'type':'Timeline<{timestamp: Timestamp, type: Enum<*>, name: String}>'}},'extraState':{'variable':'Timeline<{timestamp: Timestamp, type: Enum<*>, name: String}>'}}},'QUERY':{'block':{'type':'timeline_timestamp','inputs':{'TIMESTAMP':{'shadow':{'type':'timeline_date_picker','fields':{'TIMESTAMP':{'value':'01.01.2020'}}}}},'next':{'block':{'type':'timeline_event_occurs','fields':{'OP':{'value':'OCCURS'}},'inputs':{'EVENT':{'shadow':{'type':'struct_select','inputs':{'PROPERTY_Hr~%I9I+KmEsXoV0dQn!':{'shadow':{'type':'string_immediate','fields':{'VALUE':{'value':'U1'}}}}},'extraState':{'variableType':'{timestamp: Timestamp, type: Enum<*>, name: String}','inputs':[{'name':'PROPERTY_Hr~%I9I+KmEsXoV0dQn!','propertyName':'name','shadow':{'type':'string_immediate','id':'C~KCQuNvGDj^VP!C-K{T','fields':{'VALUE':'U1'}}}]}}}}}}}}}}"}

#### Datum-ist-x-Block :anchor{id="timeline-timestamp"} :blockinfo{type="timeline_timestamp"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Block stellt ein Datum dar, das in der Zeitleiste vorkommen soll. Damit kann überprüft werden:
- ob das Datum in der Zeitleiste liegt, also nach dem ersten und vor dem letzten Zeitpunkt.
- ob ein Ereignis vor oder nach diesem Datum statt gefunden hat, je nachdem ob der Ereignisblock vor oder nach dem Datumblock platziert wird.

Der Block hat ein Eingabefeld, in das das [Datum eingegeben](#date-time-input) werden kann.

::block-preview{block="{'type':'timeline_timestamp','inputs':{'TIMESTAMP':{'shadow':{'type':'timeline_date_picker','fields':{'TIMESTAMP':{'value':'01.01.2020'}}}}}}"}

#### Ereignis-Block :anchor{id="timeline-event"} :blockinfo{type="timeline_event_occurs"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Block stellt ein Ereignis dar, das in der Zeitleiste vorkommen soll. Ein Ereignis ist eine Struktur, die mindestens ein Attribut `timestamp` und ein Attribut `type` enthält. Das Attribut `timestamp` ist ein Zeitpunkt und das Attribut `type` ist ein Text. Das Ereignis kann auch weitere Attribute von beliebigen Typen enthalten. 

Das Vergleichen des Ereignisses folgt den gleichen Regeln wie das Vergleichen von Strukturen im [:inline-block-preview{block="{'type':'comparison_matches'}" text="Entspricht-Block"}](#matches).

Der Block hat ein Eingabefeld, in das die Struktur des Ereignisses eingegeben werden kann.

::block-preview{block="{'type':'timeline_event_occurs','fields':{'OP':{'value':'OCCURS'}}}"}

Wenn der Operator `tritt nicht auf für` ausgewählt wird, erscheint ein weiteres Eingabefeld, in das eine Zahl eingegeben werden kann, um die Zeit zu definieren, für die das Ereignis nicht vorkommen soll.

::block-preview{block="{'type':'timeline_event_occurs','fields':{'OP':{'value':'DOES_NOT_OCCUR_FOR'}, 'TIME_UNIT':{'value': 'd'}}}"}

Neben dem Vergleich auf das Vorkommen eines Ereignisses gibt es noch folgende Operationen:

| Operation | Beschreibung |
|-----------|--------------|
| `tritt auf` | Das Ereignis kommt in der Zeitleiste vor. |
| `tritt nicht auf` | Das Ereignis kommt nicht in der Zeitleiste vor, bis das nächste Ereignis oder der nächste [:inline-block-preview{block="{'type':'timeline_timestamp','inputs':{'TIMESTAMP':{'shadow':{'type':'timeline_date_picker','fields':{'TIMESTAMP':{'value':'01.01.2020'}}}}}}" text="Datums-Block"}](#timeline-timestamp) kommt. |
| `tritt nicht auf für` | Das Ereignis kommt für eine bestimmte Zeit nicht vor. Dieser Block blockiert das Template für die eingegebene Zeit **nicht**. |
| `tritt zum ersten Mal auf` | Das Ereignis kommt zum ersten Mal in der Zeitleiste vor. |
| `tritt zum letzten Mal auf` | Das Ereignis kommt zum letzten Mal in der Zeitleiste vor. |

#### Ereignis-Block mit Abfrage :anchor{id="timeline-event-query"} :blockinfo{type="timeline_event_occurs_match"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Block stellt ein Ereignis dar, das in der Zeitleiste vorkommen soll. Ein Ereignis ist eine Struktur, die mindestens ein Attribut `timestamp` und ein Attribut `type` enthält. Das Attribut `timestamp` ist ein Zeitpunkt und das Attribut `type` ist ein Text. Das Ereignis kann auch weitere Attribute von beliebigen Typen enthalten. Man kann nicht nur nach einem Ereignis suchen, sondern auch nach einem Intervall-Anfang oder -Ende. Dazu wählt man im Dropdown `Anfang von Intervall` oder `Ende von Intervall` aus.

Ähnlich wie im [:inline-block-preview{block="{'type':'list_any_all','fields':{'OP':{'value':'ANY'},'VALUE':{'value':'value'}},'inputs':{'QUERY':{}}}" text="Listenquantifizierungs-Block"}](#list-any-all) gibt es eine lokale Variable mit dem Namen "Ereignis", die in der Bedingung verwendet werden kann. Diese Variable beinhaltet das aktuelle Ereignis.

::block-preview{block="{'type':'timeline_event_occurs_match','fields':{'VALUE':{'value':'Ereignis'},'OP':{'value':'OCCURS'}},'extraState':'<mutation time_unit_input=\'false\'></mutation>'}"}

Wenn der Operator `tritt nicht auf für` ausgewählt wird, erscheint ein weiteres Eingabefeld, in das eine Zahl eingegeben werden kann, um die Zeit zu definieren, für die das Ereignis nicht vorkommen soll.

::block-preview{block="{'type':'timeline_event_occurs_match','fields':{'VALUE':{'value':'Ereignis'},'OP':{'value':'DOES_NOT_OCCUR_FOR'},'TIME_UNIT':{'value':'s'}},'inputs':{'TIME':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}},'extraState':'<mutation time_unit_input=\'true\'></mutation>'}"}

Wenn `Anfang von Intervall` oder `Ende von Intervall` ausgewählt wird, wird die lokale Variable `Intervall` genannt um Aussagen über das Intervall zu treffen.

::block-preview{block="{'type':'timeline_event_occurs_match','fields':{'SUBJECT':{'value':'START'},'VALUE':{'value':'Intervall'},'OP':{'value':'OCCURS'}},'extraState':'<mutation time_unit_input=\'false\'></mutation>'}"}

Neben dem Vergleich auf das Vorkommen eines Ereignisses gibt es noch folgende Operationen:

| Operation | Beschreibung |
|-----------|--------------|
| `tritt auf` | Das Ereignis kommt in der Zeitleiste vor. |
| `tritt nicht auf` | Das Ereignis kommt nicht in der Zeitleiste vor, bis das nächste Ereignis oder der nächste [:inline-block-preview{block="{'type':'timeline_timestamp','inputs':{'TIMESTAMP':{'shadow':{'type':'timeline_date_picker','fields':{'TIMESTAMP':{'value':'01.01.2020'}}}}}}" text="Datums-Block"}](#timeline-timestamp) kommt. |
| `tritt nicht auf für` | Das Ereignis kommt für eine bestimmte Zeit nicht vor. Dieser Block blockiert das Template für die eingegebene Zeit **nicht**. |
| `tritt zum ersten Mal auf` | Das Ereignis kommt zum ersten Mal in der Zeitleiste vor. |
| `tritt zum letzten Mal auf` | Das Ereignis kommt zum letzten Mal in der Zeitleiste vor. |

:::info-box{type="tip"}
Häufig soll eine Aussage über einzelne Attribute des Ereignisses getroffen werden, hierfür eignet sich der [:inline-block-preview{block="{'type':'struct_get_property'}" text="Struktur-Attribut auswählen-Block"}](#struct-get).
:::

#### Intervall-Grenzen-Block :anchor{id="timeline-interval"} :blockinfo{type="timeline_start_of_interval"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Intervalle in einer Zeitleiste bestehen aus zwei Zeitpunkten, einem Anfangs- und einem Endzeitpunkt. Um ein Intervall in einem Template zu verwenden,können diese beiden Zeitpunkte mit dem :inline-block-preview{block="{'type':'timeline_start_of_interval'}" text="Intervall-Anfang-Block"} und dem :inline-block-preview{block="{'type':'timeline_end_of_interval'}" text="Intervall-Ende-Block"} abgefragt und dann wie Ereignisse verwendet werden.

Das Intervall kann genauso wie Ereignisse auf Grund von Strukturdaten ausgewählt werden.

Intervall-Anfangs-Block:
::block-preview{block="{'type':'timeline_start_of_interval'}"}

Intervall-Ende-Block:
::block-preview{block="{'type':'timeline_end_of_interval'}"}

#### Nach-x-Zeiteinheiten-Block :anchor{id="timeline-after"} :blockinfo{type="timeline_after"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Block stellt einen Zeitraum dar, der nach einem bestimmten Zeitpunkt in der Zeitleiste beginnt. Ereignisse während dieses Zeitraums werden nicht berücksichtigt. 

Der Block hat ein Eingabefeld, in das eine Zahl eingegeben werden kann, um die Zeit zu definieren, nach der das Ereignis stattfinden soll. Die Zeiteinheit kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'timeline_after','fields':{'OP':{'value':'EXACTLY'},'UNIT':{'value':'d'}},'inputs':{'NUM':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

Der Block oben legt einen exakten Zeitpunkt fest, nach dem das Ereignis stattfinden soll. Es gibt noch folgende Operationen:

| Operation | Beschreibung |
|-----------|--------------|
| `exakt` | Das Ereignis findet genau x Zeiteinheiten nach dem Zeitpunkt statt. |
| `mindestens` | Das Ereignis findet mindestens x Zeiteinheiten nach dem Zeitpunkt statt. |
| `höchstens` | Das Ereignis findet höchstens x Zeiteinheiten nach dem Zeitpunkt statt. |

#### Nach-x-bis-y-Zeiteinheiten-Block :anchor{id="timeline-after-interval"} :blockinfo{type="timeline_after_interval"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Mit diesem Block kann überprüft werden, ob ein Ereignis mindestens x und höchstens y Zeiteinheiten nach einem anderen Ereignis stattgefunden hat.

Der Block hat zwei Eingabefelder, in die Zahlen eingegeben werden können, um die minimale und höchste Zeit zu definieren. Die Zeiteinheit kann aus einer Dropdown-Liste ausgewählt werden.

::block-preview{block="{'type':'timeline_after_interval','fields':{'UNIT':{'value':'d'}},'inputs':{'START':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'END':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

#### Entweder-Oder-Template-Block :anchor{id="timeline-or"} :blockinfo{type="timeline_either_or"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Entweder-Oder-Template-Block wird verwendet, um zwei oder mehr Optionen innerhalb eines Templates zur Verfügung zu stellen. Es gibt zwei Buttons, um weitere `Oder`-Zweige hinzuzufügen, bzw. zu entfernen.

::block-preview{block="{'type':'timeline_either_or','extraState':{'inputNames':[]}}"}

Mit diesem Block kann zum Beispiel überprüft werden, ob ein Ereignis entweder 2 oder 5 Tage nach einem anderen Ereignis stattgefunden hat. 

Ein anderer Anwendungsfall wäre, dass während eines Aufenthalts im Krankenhaus entweder eine Blutdruckmessung oder eine Blutzuckermessung durchgeführt wurde.

#### Wiederhole-x-Mal-Block :anchor{id="timeline-repeat"} :blockinfo{type="timeline_loop_count"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Block stellt eine Wiederholung von Ereignissen in der Zeitleiste dar. Der Block hat ein Eingabefeld, in das eine Zahl eingegeben werden kann, um die Anzahl der Wiederholungen zu definieren. 

Das gesamte Template innerhalb des Wiederholungsblocks wird exakt so oft wiederholt, wie im Eingabefeld angegeben.

::block-preview{block="{'type':'timeline_loop_count','inputs':{'NUM':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}}}"}

#### Wiederhole-bis-Block :anchor{id="timeline-repeat-until"} :blockinfo{type="timeline_loop_until"}
:::info-box{type="note"}
Dieser Block wird als Teil eines Templates in einem [:inline-block-preview{block="{'type':'timeline_query'}" text="Timeline Match Block"}](#timeline-match) verwendet.
:::

Der Block stellt eine Wiederholung von Ereignissen in der Zeitleiste dar. Der Block hat ein Eingabefeld, in das ein Ereignis eingegeben werden kann, das das Ende der Wiederholung markiert.

Das gesamte Template innerhalb des Wiederholungs-Blocks wird so oft wiederholt, bis das Ereignis eintritt, das im Eingabefeld angegeben wurde.

::block-preview{block="{'type':'timeline_loop_until'}"}