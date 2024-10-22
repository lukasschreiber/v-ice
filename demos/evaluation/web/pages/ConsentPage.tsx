import { useEvaluationState } from "../store/useEvaluationHook";

export function ConsentPage() {
    const { evaluation, setEvaluationProperty } = useEvaluationState();

    return (
        <div className="p-2 overflow-auto">
            <h1 className="font-semibold text-xl">Einverständnis</h1>
            <p className="mb-2">
                Ich habe die Erläuterung zur Studie gelesen und bin damit einverstanden, an der genannten Studie
                teilzunehmen.
            </p>
            <p className="mb-2">
                Ich erkläre mich einverstanden, dass die im Rahmen der Studie erhobenen Daten zu wissenschaftlichen
                Zwecken ausgewertet und in pseudonymisierter Form gespeichert werden. Ich bin mir darüber bewusst, dass
                meine Teilnahme freiwillig erfolgt und ich den Versuch jederzeit und ohne die Angabe von Gründen
                abbrechen kann.
            </p>
            <div className="flex gap-2">
                <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    checked={evaluation.user?.consentGiven || false}
                    onChange={() => setEvaluationProperty("user.consentGiven", !evaluation.user?.consentGiven)}
                />
                <label htmlFor="consent" className="font-semibold">
                    Ich erkläre, dass ich die unten genannte Erklärung gelesen habe und mit den Bedinungen zur
                    Studienteilnahme einverstanden bin.
                </label>
            </div>
            <div className="text-sm text-gray-600 [&>p,&>ul]:mb-2 [&>h1]:text-xl [&>h1]:font-semibold [&>h2]:text-lg [&>h2]:font-semibold [&>ul]:list-disc [&>ul]:list-outside [&>ul]:pl-[revert] [&>p>a[href]]:text-primary-500 [&>p>a[href]]:underline [&>hr]:my-4">
                <hr />
                <h1>Aufklärungsbogen & Erklärung zum Datenschutz</h1>
                <p>
                    Wir möchten Sie bitten, die nachfolgenden Erläuterungen zum Inhalt der Studie zu lesen und die
                    obenstehende Checkbox abzuhaken, sofern Sie damit einverstanden sind.
                </p>
                <h2>Gegenstand der Studie</h2>
                <p>
                    Im Zentrum der Studie steht eine neu entwickelte visuelle Abfragesprache. Die Studie überprüft, ob
                    diese visuelle Abfragesprache Domänenexperten der Medizin dazu befähigt, effizient komplexe
                    Aufgabestellungen zu lösen. Um die generelle Nutzbarkeit zu überprüfen, wird die visuelle
                    Abfragesprache auch von Personen ohne Domänenwissen getestet.
                </p>
                <h2>Ablauf der Studie</h2>
                <p>
                    Zunächst werden Sie gebeten, einige allgemeine Fragen zur Demographie und zur Erfahrung mit
                    Computerprogrammen zu beantworten. Im Falle, dass Sie Domänenexperte der Medizin sind, werden Sie
                    zusätzlich um die Beantwortung einiger Fragen zu Ihrer Erfahrung mit Kohortbildung gebeten. Im
                    Anschluss haben Sie die Möglichkeit das Programm frei zu erkunden. Hierzu werden
                    Beispielaufgabestellungen zur Verfügung gestellt und ein bebilderter Leitfaden, der die Bedienung
                    des Programms erläutert. Für diese Erkundunsphase haben Sie so viel Zeit wie Sie möchten. Nachdem
                    Sie sich mit dem Programm vertraut gemacht haben, werden Sie gebeten, einige Aufgaben zu lösen. Sie
                    werden eine Aufgabenstellung sehen und können, nachdem Sie die Problemstellung verstanden haben
                    auf "Start" klicken. Die Aufgabe wird dann von Ihnen mit der visuellen Abfragesprache gelöst. Sie
                    können jede Aufgabe nur einmal lösen. Nachdem Sie die Aufgabe gelöst haben, können Sie rechts oben auf "Weiter"
                    klicken, um zur nächsten Aufgabe zu gelangen. Während der Aufgabenlösung wird die Zeit gemessen, die
                    Sie benötigen, um die Aufgabe zu lösen. Nachdem Sie die Aufgabe gelöst haben, sehen Sie eine
                    Rückmeldung, ob Ihre Lösung korrekt war und wie viel Zeit Sie benötigt haben. Nachdem Sie alle Aufgaben
                    gelöst haben, werden Sie gebeten, einen standardisierten Frageboden auszufüllen. Dieser Fragebogen
                    erfasst Ihre Einschätzung der Nutzbarkeit des Programms.
                </p>
                <h2>Dauer und Aufwandsentschädigung</h2>
                <p>
                    Die Studie dauert ca. 30 Minuten. Die tatsächliche Dauer hängt von Ihrer Geschwindigkeit bei der
                    Lösung der Aufgaben ab. Eine Aufwandsentschädigung erhalten die Teilnehmenden nicht.
                </p>
                <h2>Möglicher Nutzen der Studie</h2>
                <p>
                    Ziel der Bachelorarbeit ist es, Ärzten und Ärztinnen eine einfache Lösung zu geben, selbstständig
                    Kohorten zu erstellen. Die Anwendung einer visuellen Programmiersprache kann mögliche
                    Kommunikationslücken zwischen Mediziner*innen und Analyst*innen schließen, wenn Kohorten direkt
                    selbst definiert werden können. 
                    Diese Studie soll die Nutzbarkeit der visuellen Programmiersprache überprüfen und Einblicke in die
                    Art und Weise geben, wie Nutzer die visuelle Programmiersprache verwenden. Die Ergebnisse der Studie
                    können dazu verwendet werden, die visuelle Programmiersprache zu evaluieren.
                </p>
                <h2>Mit der Teilnahme verbundene Erfahrungen/Risiken</h2>
                <p>
                    Die Teilnehmerinnen und Teilnehmer an dieser Studie werden keinem Risiko ausgesetzt, das über die
                    Risiken des alltäglichen Lebens hinausgeht.
                </p>
                <hr />
                <h1>Erklärung zum Datenschutz</h1>
                <p>
                    Die Datenverarbeitung dieser Studie geschieht nach datenschutzrechtlichen Bestimmungen der
                    Datenschutzgrundverordnung (DSGVO) sowie des Hessischen Datenschutz- und
                    Informationsfreiheitsgesetzes (HDSIG). Die Daten werden ausschließlich für die im Aufklärungsbogen
                    beschriebenen Zwecke verwendet.
                </p>
                <p>Im Rahmen dieser Studie werden folgende Daten erhoben:</p>
                <ul className="list-disc">
                    <li>Ergebnisse der Aufgaben in Form von kodierten Arbeitsbereichdaten</li>
                    <li>
                        Zeiten, die für die Lösung der Aufgaben benötigt wurden, alle Zeiten werden relativ zum
                        Startzeitpunkt aufgezeichnet und erlauben keinen Rückschluss auf die Uhrzeit zu der Sie an der
                        Evaluation teilgenommen haben.
                    </li>
                    <li>Der Name und die Version Ihres Webbrowsers (User Agent)</li>
                    <li>Die Farbschemapräferenz Ihres Systems</li>
                    <li>Ihre Bildschirmauflösung</li>
                    <li>
                        Informationen zur Benutzung des Prototypen, z.B. Mausklicks, Bewegungen der Blöcke,
                        Scrollbewegungen, Seitenansichten, etc.
                    </li>
                    <li>Antworten auf den Fragebogen zur Demographie</li>
                    <li>Antworten auf den Fragebogen zur Nutzbarkeit (SUS)</li>
                </ul>
                <p>Als Personenbezogen Daten werden erhoben</p>
                <ul>
                    <li>Alter (geclustert)</li>
                    <li>Geschlecht</li>
                    <li>Studienfach/Branche</li>
                    <li>Erfahrung mit Computersystemen</li>
                    <li>Höchster Bildungsabschluss</li>
                    <li>ggf. Medizinische Fachrichtung und Berufserfahrung</li>
                </ul>
                <h1>Vertraulichkeit</h1>
                <p>
                    Alle im Rahmen dieser Studie erhobenen Daten sind selbstverständlich vertraulich und werden nur in
                    anonymisierter Form genutzt. Demographische Angaben wie Alter oder Geschlecht lassen keinen
                    eindeutigen Schluss auf Ihre Person zu. Zu keinem Zeitpunkt im Rahmen der jeweiligen Untersuchung
                    werden wir Sie bitten, Ihren Namen oder andere eindeutige Informationen zu nennen.
                </p>
                <h1>Aufbewahrung</h1>
                <p>
                    Die mit dieser Studie erhobenen Daten werden in Deutschland gespeichert und die Rohdaten nach dem
                    01.08.2024 gelöscht. Die Speicherung erfolgt in einer Form, die keinen Rückschluss auf Ihre Person
                    zulässt, das heißt die Daten werden pseudonymisiert.
                </p>
                <h1>Freiwilligkeit & Rechte der Versuchspersonen</h1>
                <p>
                    Ihre Teilnahme an dieser Untersuchung ist freiwillig. Es steht Ihnen zu jedem Zeitpunkt dieser
                    Studie frei, Ihre Teilnahme abzubrechen und damit diese Einwilligung zurückziehen (Widerruf), ohne
                    dass Ihnen daraus Nachteile entstehen. Wenn Sie die Teilnahme abbrechen, werden keine Daten von
                    Ihnen gespeichert und alle bisher vorliegenden Daten zu Ihrer Person vernichtet. Sie haben das
                    Recht, Auskunft über die Sie betreffenden personenbezogenen Daten zu erhalten sowie ggf. deren
                    Berichtigung oder Löschung zu verlangen. Außerdem haben Sie das Recht auf Einschränkung der
                    Verarbeitung, das Recht auf Widerspruch gegen die Verarbeitung und das Recht auf
                    Datenübertragbarkeit, in einer gängigen, strukturierten und maschinenlesbaren Form. In Streitfällen
                    haben Sie das Recht, sich beim Hessischen Datenschutzbeauftragten zu beschweren (Adresse s.u.).
                </p>
                <hr />
                <p>
                    Bei <b>Fragen</b>, <b>Anregungen</b> oder <b>Beschwerden</b> können Sie sich gerne schriftlich bzw.
                    telefonisch an die Studienleitung wenden.
                </p>
                <p>
                    Lukas Schreiber, TU Darmstadt
                    <br /> Email:{" "}
                    <a href="mailto:lukas.schreiber@stud.tu-darmstadt.de">lukas.schreiber@stud.tu-darmstadt.de</a>
                    <br />
                    Markus Höhn, M.Sc., Fraunhofer IGD Darmstadt
                    <br /> Email: <a href="mailto:markus.hoehn@igd.fraunhofer.de">markus.hoehn@igd.fraunhofer.de</a>
                </p>
                <p>
                    Verantwortliche Person für die Datenverarbeitung dieser Studie:
                    <br /> Lukas Schreiber, TU Darmstadt
                    <br /> Email:{" "}
                    <a href="mailto:lukas.schreiber@stud.tu-darmstadt.de">lukas.schreiber@stud.tu-darmstadt.de</a>
                </p>
                <p>
                    Bei Fragen zum Datenschutz kann auch der Datenschutzbeauftragte der TU Darmstadt kontaktiert werden:
                    Jan Hansen
                    <br /> Email: <a href="mailto:datenschutz@tu-darmstadt.de">datenschutz@tu-darmstadt.de</a>
                </p>
                <p>
                    Kontaktadresse des Hessischen Datenschutzbeauftragten:
                    <br /> Email: <a href="mailto:poststelle@datenschutz.hessen.de">poststelle@datenschutz.hessen.de</a>
                </p>
                <hr />
            </div>
            <div className="flex gap-2">
                <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    checked={evaluation.user?.consentGiven || false}
                    onChange={() => setEvaluationProperty("user.consentGiven", !evaluation.user?.consentGiven)}
                />
                <label htmlFor="consent" className="font-semibold">
                    Ich erkläre, dass ich die oben genannte Erklärung gelesen habe und mit den Bedinungen zur Studienteilnahme
                    einverstanden bin.
                </label>
            </div>
        </div>
    );
}
