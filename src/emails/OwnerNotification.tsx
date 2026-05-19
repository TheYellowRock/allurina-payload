import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

import type { CSSProperties } from "react"

import type { OrderEmailProps } from "@/lib/order-email-types"

function formatDh(n: number): string {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n)} Dh`
}

export default function OwnerNotificationEmail(props: OrderEmailProps) {
  const linesText = props.lines
    .map(
      (l) =>
        `- ${l.title} | qty=${l.quantity} | ${formatDh(l.unitPriceDh)} | line=${formatDh(l.lineTotalDh)}`,
    )
    .join("\n")

  const body = [
    `ORDER ${props.orderReference}`,
    `status=${props.status} payment=${props.paymentMethod}`,
    "",
    "CUSTOMER",
    `name=${props.customerName}`,
    `email=${props.email}`,
    `phone=${props.phone}`,
    "",
    "SHIP TO",
    props.addressLine1,
    ...(props.addressLine2 ? [props.addressLine2] : []),
    [props.postalCode, props.city].filter(Boolean).join(" "),
    props.country,
    "",
    ...(props.notes ? ["NOTES", props.notes, ""] : []),
    "ITEMS",
    linesText,
    "",
    "TOTALS",
    `subtotal=${formatDh(props.subtotalDh)}`,
    `delivery=${formatDh(props.deliveryFeeDh)}`,
    `GRAND_TOTAL=${formatDh(props.grandTotalDh)}`,
  ].join("\n")

  return (
    <Html lang="fr">
      <Head />
      <Preview>{`[Allurina] ${props.orderReference}`}</Preview>
      <Body style={bodyStyle}>
        <Container style={container}>
          <Section>
            <Text style={mono}>{body}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle: CSSProperties = {
  backgroundColor: "#fafafa",
  margin: 0,
  padding: "16px",
}

const container: CSSProperties = {
  maxWidth: "720px",
  margin: "0 auto",
}

const mono: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "12px",
  lineHeight: 1.5,
  color: "#171717",
  whiteSpace: "pre-wrap" as const,
  margin: 0,
}
