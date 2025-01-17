### Eingabe von Werten
In die meisten Blöcke können Werte direkt eingegeben werden. Welchen Typ der Wert haben muss, wird durch den Block und die anderen Eingabefelder bestimmt. Wenn zum Beispiel eine Variable vom Typ `Zahl` in den :inline-block-preview{block="{'type': 'comparison_equals'}" text="Gleichheits-Block"} eingefügt wird, werden in allen Eingabefeldern nur Zahlen akzeptiert.

:::info-box{type="note"}
Auch wenn ein Block :inline-block-preview{block="{'type':'comparison_equals','inputs':{'A':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}},'B':{'shadow':{'type':'math_number','fields':{'NUM':{'value':''}}}}},'extraState':{'inputTypes':{'A':'*?','B':'*?'},'originalTypes':{'A':'*?','B':'*?','DELTA':'Number?','C':'Union<Number | Timestamp>?','LIST':'List<*?>','VALUE':'*?','LIST1':'List<*?>','LIST2':'List<*?>'}}}" text="schon Eingabefelder hat"}, aber keine Variable oder kein anderer Block vorhanden ist, der den Typ bestimmt, kann der Typ durch das andocken eines Blocks im Eingabefeld bestimmt werden.
:::
