import type { Metadata } from "next"
import Link from "next/link"

import { PRIVACY_POLICY_PATH } from "@/lib/routes"

const PAGE_TITLE = "Politique de confidentialité — AllurinaScarf"
const PAGE_DESCRIPTION =
  "Comment AllurinaScarf collecte, utilise et protège vos données personnelles lors de la navigation et des commandes sur notre boutique en ligne."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: PRIVACY_POLICY_PATH,
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: PRIVACY_POLICY_PATH,
  },
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-full flex-1 bg-[#faf9f7] text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <nav className="text-sm text-stone-600">
          <Link href="/" className="hover:text-stone-900">
            Accueil
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <span className="text-stone-900">Politique de confidentialité</span>
        </nav>

        <header className="mt-8 border-b border-stone-200 pb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mt-3 text-sm text-stone-600">
            Dernière mise à jour : <time dateTime="2026-05-02">2 mai 2026</time>
          </p>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-stone-700">
            La présente politique décrit comment{" "}
            <strong className="font-medium text-stone-900">AllurinaScarf</strong> (« nous », «
            notre ») traite les données personnelles des personnes qui visitent notre site, créent un
            compte, passent commande ou s&apos;inscrivent à nos communications. En utilisant le
            site, vous acceptez les pratiques décrites ci-dessous dans la mesure permise par la loi
            applicable.
          </p>
        </header>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-stone-700 md:text-[15px] md:leading-[1.7]">
          <section aria-labelledby="s1">
            <h2 id="s1" className="text-lg font-semibold tracking-tight text-stone-900">
              1. Responsable du traitement
            </h2>
            <p className="mt-3">
              Le responsable du traitement des données est la société exploitant la marque et la
              boutique en ligne <strong className="font-medium text-stone-900">AllurinaScarf</strong>
              , dont le siège et les coordonnées complètes peuvent être communiqués sur demande
              écrite. Pour toute question relative à cette politique ou à vos données :{" "}
              <a
                href="mailto:privacy@allurinascarf.com"
                className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700"
              >
                privacy@allurinascarf.com
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="s2">
            <h2 id="s2" className="text-lg font-semibold tracking-tight text-stone-900">
              2. Données que nous collectons
            </h2>
            <p className="mt-3">Nous pouvons traiter notamment les catégories suivantes :</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-stone-900">Données d&apos;identification et de
                contact</strong> : nom, prénom, adresse e-mail, numéro de téléphone, adresse postale
                de livraison ou de facturation.
              </li>
              <li>
                <strong className="font-medium text-stone-900">Données de commande</strong> : détail
                des articles, montants, références de commande, historique d&apos;achat, messages
                liés au service client.
              </li>
              <li>
                <strong className="font-medium text-stone-900">Données de paiement</strong> : selon le
                moyen de paiement utilisé, des informations peuvent être traitées par nos
                prestataires de paiement certifiés ; nous ne conservons pas vos codes confidentiels
                de carte bancaire sur nos propres serveurs lorsque le paiement est délégué à un
                tiers conforme aux normes en vigueur (par ex. PCI-DSS).
              </li>
              <li>
                <strong className="font-medium text-stone-900">Données techniques</strong> : adresse
                IP, type d&apos;appareil et de navigateur, pages consultées, horodatages, identifiants
                de session, journaux de sécurité.
              </li>
              <li>
                <strong className="font-medium text-stone-900">Communications marketing</strong> :{" "}
                adresse e-mail et préférences si vous vous inscrivez volontairement à la newsletter
                ou acceptez de recevoir des offres.
              </li>
            </ul>
          </section>

          <section aria-labelledby="s3">
            <h2 id="s3" className="text-lg font-semibold tracking-tight text-stone-900">
              3. Finalités et bases légales
            </h2>
            <p className="mt-3">Nous utilisons vos données pour :</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-stone-900">Exécuter votre commande</strong>{" "}
                (contrat) : traitement, livraison, facturation, service après-vente, lutte contre la
                fraude liée aux transactions.
              </li>
              <li>
                <strong className="font-medium text-stone-900">Faire fonctionner le site</strong>{" "}
                (intérêt légitime / exécution de mesures techniques) : sécurité, statistiques
                agrégées, amélioration de l&apos;expérience utilisateur, maintenance.
              </li>
              <li>
                <strong className="font-medium text-stone-900">Respecter nos obligations légales</strong>{" "}
                : comptabilité, conservation de pièces justificatives, réponses aux autorités
                habilitées.
              </li>
              <li>
                <strong className="font-medium text-stone-900">Prospection commerciale</strong>{" "}
                (consentement lorsque requis) : envoi de newsletters ou d&apos;offres ciblées ; vous
                pouvez retirer votre consentement à tout moment.
              </li>
            </ul>
          </section>

          <section aria-labelledby="s4">
            <h2 id="s4" className="text-lg font-semibold tracking-tight text-stone-900">
              4. Cookies et technologies similaires
            </h2>
            <p className="mt-3">
              Nous utilisons des cookies et traceurs pour assurer le bon fonctionnement du site (par
              exemple panier, session, sécurité), mesurer l&apos;audience de manière anonymisée ou
              agrégée lorsque c&apos;est applicable, et, avec votre accord lorsque la loi l&apos;exige,
              proposer des contenus ou publicités personnalisés. Vous pouvez configurer votre
              navigateur pour refuser certains cookies ; certaines fonctionnalités du site pourraient
              alors être limitées.
            </p>
          </section>

          <section aria-labelledby="s5">
            <h2 id="s5" className="text-lg font-semibold tracking-tight text-stone-900">
              5. Destinataires et sous-traitants
            </h2>
            <p className="mt-3">
              Vos données peuvent être communiquées à des prestataires de confiance strictement pour
              les besoins décrits ci-dessus : hébergement du site et de la base de données, envoi
              d&apos;e-mails transactionnels, traitement des paiements, transporteurs, outils
              d&apos;analyse. Ces acteurs sont contractuellement tenus de respecter la
              confidentialité et la sécurité des données et ne peuvent les utiliser à d&apos;autres
              fins.
            </p>
          </section>

          <section aria-labelledby="s6">
            <h2 id="s6" className="text-lg font-semibold tracking-tight text-stone-900">
              6. Transferts hors Maroc ou hors Union européenne
            </h2>
            <p className="mt-3">
              Certains de nos prestataires peuvent être situés dans d&apos;autres pays. Le cas
              échéant, nous mettons en œuvre les garanties appropriées (clauses contractuelles types,
              décisions d&apos;adéquation, ou mécanismes reconnus par la réglementation applicable)
              afin d&apos;assurer un niveau de protection conforme aux exigences en vigueur.
            </p>
          </section>

          <section aria-labelledby="s7">
            <h2 id="s7" className="text-lg font-semibold tracking-tight text-stone-900">
              7. Durées de conservation
            </h2>
            <p className="mt-3">
              Nous conservons vos données le temps nécessaire aux finalités pour lesquelles elles ont
              été collectées, augmenté des délais légaux de prescription applicable en matière
              commerciale, comptable ou fiscale. Les données de prospection peuvent être conservées
              jusqu&apos;à votre désinscription et au-delà pour preuve en cas de litige, dans la limite
              des durées autorisées.
            </p>
          </section>

          <section aria-labelledby="s8">
            <h2 id="s8" className="text-lg font-semibold tracking-tight text-stone-900">
              8. Sécurité
            </h2>
            <p className="mt-3">
              Nous appliquons des mesures techniques et organisationnelles appropriées (chiffrement
              en transit lorsque pertinent, contrôle d&apos;accès, mots de passe forts côté
              administration, sauvegardes) pour protéger vos données contre l&apos;accès non autorisé,
              la perte ou l&apos;altération. Aucun système n&apos;étant infaillible, nous vous invitons
              également à protéger vos identifiants.
            </p>
          </section>

          <section aria-labelledby="s9">
            <h2 id="s9" className="text-lg font-semibold tracking-tight text-stone-900">
              9. Vos droits
            </h2>
            <p className="mt-3">
              Conformément à la loi n° 09-08 relative à la protection des personnes physiques à
              l&apos;égard du traitement des données à caractère personnel (Maroc) et, le cas
              échéant, au Règlement général sur la protection des données (UE) pour les personnes
              concernées concernées, vous disposez notamment d&apos;un droit d&apos;accès, de
              rectification, d&apos;effacement, de limitation, d&apos;opposition pour motifs légitimes,
              et de portabilité lorsque applicable. Vous pouvez retirer votre consentement à la
              réception de messages commerciaux à tout moment via le lien de désinscription ou en
              nous écrivant.
            </p>
            <p className="mt-3">
              Pour exercer vos droits :{" "}
              <a
                href="mailto:privacy@allurinascarf.com"
                className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700"
              >
                privacy@allurinascarf.com
              </a>
              . Vous pouvez également introduire une réclamation auprès de la{" "}
              <strong className="font-medium text-stone-900">
                Commission Nationale de contrôle de la protection des Données à caractère Personnel
                (CNDP)
              </strong>{" "}
              au Maroc, ou de l&apos;autorité de protection des données compétente de votre pays de
              résidence habituelle dans l&apos;Union européenne.
            </p>
          </section>

          <section aria-labelledby="s10">
            <h2 id="s10" className="text-lg font-semibold tracking-tight text-stone-900">
              10. Mineurs
            </h2>
            <p className="mt-3">
              Nos services s&apos;adressent aux personnes majeures capables de contracter. Nous ne
              collectons pas sciemment de données relatives à des mineurs sans le consentement du
              titulaire de l&apos;autorité parentale lorsque la loi l&apos;exige.
            </p>
          </section>

          <section aria-labelledby="s11">
            <h2 id="s11" className="text-lg font-semibold tracking-tight text-stone-900">
              11. Modifications
            </h2>
            <p className="mt-3">
              Nous pouvons mettre à jour cette politique pour refléter l&apos;évolution de nos
              pratiques ou des obligations légales. La date de « dernière mise à jour » en tête de
              page sera révisée ; en cas de changement substantiel, nous pourrons vous en informer par
              e-mail ou par un avis visible sur le site lorsque cela est approprié.
            </p>
          </section>

          <section aria-labelledby="s12">
            <h2 id="s12" className="text-lg font-semibold tracking-tight text-stone-900">
              12. Contact
            </h2>
            <p className="mt-3">
              Pour toute question relative à la protection des données ou à cette politique,
              contactez-nous à :{" "}
              <a
                href="mailto:privacy@allurinascarf.com"
                className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700"
              >
                privacy@allurinascarf.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
