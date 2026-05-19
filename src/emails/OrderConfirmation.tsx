import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"
import type { CSSProperties } from "react"

import type { OrderEmailProps } from "@/lib/order-email-types"

const waHref = "https://wa.me/212628504758"

/** Aligns with storefront `:root` — `oklch(0.145 0 0)` foreground, white surfaces. */
const fg = "#252525"
const fgMuted = "#737373"
const border = "#ebebeb"
const surface = "#ffffff"
const pageBg = "#fafafa"

function formatDh(n: number): string {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n)} Dh`
}

export default function OrderConfirmationEmail(props: OrderEmailProps) {
  const preview = `Votre commande ${props.orderReference} est bien enregistrée.`

  const pieceCount = props.lines.reduce((acc, line) => acc + line.quantity, 0)

  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            {props.logoUrl ? (
              <Img
                src={props.logoUrl}
                alt="Allurina Scarf"
                width={200}
                height={52}
                style={logoImg}
              />
            ) : (
              <>
                <Text style={brandMark}>Allurina</Text>
                <Text style={brandSub}>Scarf</Text>
              </>
            )}
          </Section>

          <Heading as="h1" style={h1}>
            Merci, {props.customerName}
          </Heading>
          <Text style={lead}>
            Nous avons bien reçu votre commande{" "}
            <strong style={leadStrong}>{props.orderReference}</strong>. Vous payez à la livraison.
          </Text>

          <Section style={box}>
            <Text style={boxTitle}>Récapitulatif</Text>
            {props.lines.map((line, i) => (
              <Section key={`${line.title}-${i}`} style={lineBlock}>
                <Row>
                  <Column style={thumbCol}>
                    {line.imageSrc ? (
                      <Img
                        src={line.imageSrc}
                        alt={line.title}
                        width={88}
                        height={88}
                        style={thumbImg}
                      />
                    ) : (
                      <Section style={thumbFallback}>
                        <Text style={thumbFallbackText}>—</Text>
                      </Section>
                    )}
                  </Column>
                  <Column style={lineTextCol}>
                    <Text style={lineTitle}>{line.title}</Text>
                    <Text style={lineQtyPrice}>
                      Qté {line.quantity} × {formatDh(line.unitPriceDh)} ={" "}
                      <strong style={lineQtyStrong}>{formatDh(line.lineTotalDh)}</strong>
                    </Text>
                  </Column>
                </Row>
              </Section>
            ))}
            <Hr style={hr} />
            <Text style={totalRow}>
              Sous-total articles
              <span style={pullRight}>{formatDh(props.subtotalDh)}</span>
            </Text>
            {props.deliveryFeeDh > 0 ? (
              <Text style={totalRow}>
                Livraison <span style={pullRight}>{formatDh(props.deliveryFeeDh)}</span>
              </Text>
            ) : null}
            <Hr style={hr} />
            <Text style={grand}>
              Total à régler à la livraison{" "}
              <span style={pullRight}>{formatDh(props.grandTotalDh)}</span>
            </Text>
            {props.deliveryFeeDh <= 0 && pieceCount > 0 ? (
              <Text style={deliveryFreeLine}>+ Livraison offerte</Text>
            ) : null}
          </Section>

          <Section style={box}>
            <Text style={boxTitle}>Livraison</Text>
            <Text style={deliveryEtaBox}>
              Expédition / remise estimée : <strong style={deliveryEtaStrong}>24 à 72 h</strong> après
              confirmation.
            </Text>
            <Text style={address}>
              {props.customerName}
              <br />
              {props.addressLine1}
              <br />
              {props.addressLine2 ? (
                <>
                  {props.addressLine2}
                  <br />
                </>
              ) : null}
              {props.postalCode ? `${props.postalCode} ` : ""}
              {props.city}
              <br />
              {props.country}
            </Text>
            <Text style={muted}>Tél. {props.phone}</Text>
          </Section>

          {props.notes ? (
            <Text style={notes}>
              <strong>Note :</strong> {props.notes}
            </Text>
          ) : null}

          <Hr style={hrMuted} />

          <Text style={footer}>
            Une question ? Écrivez-nous sur{" "}
            <Link href={waHref} style={link}>
              WhatsApp
            </Link>
            .
          </Text>
          <Text style={footerMuted}>Allurina — élégance modeste.</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main: CSSProperties = {
  backgroundColor: pageBg,
  fontFamily:
    'ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 16px",
}

const container: CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
}

const brand: CSSProperties = {
  marginBottom: "28px",
}

const logoImg: CSSProperties = {
  display: "block",
  height: "auto",
  maxHeight: "52px",
  width: "200px",
  objectFit: "contain" as const,
  objectPosition: "left center",
  border: 0,
}

const brandMark: CSSProperties = {
  fontSize: "22px",
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  color: fg,
  margin: "0 0 4px 0",
  fontWeight: 600,
}

const brandSub: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.35em",
  textTransform: "uppercase" as const,
  color: fgMuted,
  margin: 0,
}

const h1: CSSProperties = {
  fontSize: "24px",
  fontWeight: 500,
  color: fg,
  margin: "0 0 12px 0",
  lineHeight: 1.25,
}

const lead: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: fgMuted,
  margin: "0 0 28px 0",
}

const leadStrong: CSSProperties = {
  color: fg,
}

const box: CSSProperties = {
  backgroundColor: surface,
  border: `1px solid ${border}`,
  padding: "20px 22px",
  marginBottom: "20px",
}

const boxTitle: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: fgMuted,
  margin: "0 0 16px 0",
  fontWeight: 600,
}

const lineBlock: CSSProperties = {
  marginBottom: "18px",
}

const thumbCol: CSSProperties = {
  width: "96px",
  verticalAlign: "top" as const,
  paddingRight: "14px",
}

const thumbImg: CSSProperties = {
  display: "block",
  borderRadius: "6px",
  objectFit: "cover" as const,
  border: `1px solid ${border}`,
}

const thumbFallback: CSSProperties = {
  width: "88px",
  height: "88px",
  backgroundColor: pageBg,
  border: `1px solid ${border}`,
  borderRadius: "6px",
  textAlign: "center" as const,
  paddingTop: "30px",
  boxSizing: "border-box" as const,
}

const thumbFallbackText: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#d4d4d4",
  lineHeight: 1,
}

const lineTextCol: CSSProperties = {
  verticalAlign: "top" as const,
}

const lineTitle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: fg,
  margin: "0 0 8px 0",
}

const lineQtyPrice: CSSProperties = {
  fontSize: "14px",
  color: fgMuted,
  margin: 0,
}

const lineQtyStrong: CSSProperties = {
  color: fg,
}

const hr: CSSProperties = {
  borderColor: border,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "16px 0",
}

const hrMuted: CSSProperties = {
  borderColor: border,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "28px 0 16px",
}

const totalRow: CSSProperties = {
  fontSize: "14px",
  color: fgMuted,
  margin: "6px 0",
}

const deliveryEtaBox: CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.55,
  color: fgMuted,
  margin: "0 0 14px 0",
}

const deliveryEtaStrong: CSSProperties = {
  color: fg,
  fontWeight: 600,
}

const pullRight: CSSProperties = {
  float: "right" as const,
  fontWeight: 500,
  color: fg,
}

const deliveryFreeLine: CSSProperties = {
  fontSize: "13px",
  color: "#15803d",
  fontWeight: 500,
  margin: "10px 0 0 0",
}

const grand: CSSProperties = {
  fontSize: "17px",
  fontWeight: 600,
  color: "#b91c1c",
  margin: "8px 0 0 0",
}

const address: CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.65,
  color: fg,
  margin: "0 0 8px 0",
}

const muted: CSSProperties = {
  fontSize: "13px",
  color: fgMuted,
  margin: 0,
}

const notes: CSSProperties = {
  fontSize: "13px",
  color: fgMuted,
  margin: "0 0 20px 0",
  lineHeight: 1.5,
}

const footer: CSSProperties = {
  fontSize: "13px",
  color: fgMuted,
  margin: "0 0 8px 0",
  textAlign: "center" as const,
}

const footerMuted: CSSProperties = {
  fontSize: "11px",
  color: "#a3a3a3",
  margin: 0,
  textAlign: "center" as const,
  letterSpacing: "0.06em",
}

const link: CSSProperties = {
  color: fg,
  textDecoration: "underline",
}
