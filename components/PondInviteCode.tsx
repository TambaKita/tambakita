import { useState, useEffect } from "react"
import QRCode from "qrcode.react"
import { supabase } from "../src/lib/supabase"

interface PondInviteCodeProps {
  pond_id: string
}

export default function PondInviteCode({ pond_id }: PondInviteCodeProps) {
  const [invite_code, set_invite_code] = useState<string | null>(null)
  const [invite_code_expiry, set_invite_code_expiry] = useState<string | null>(null)
  const [time_left, set_time_left] = useState<number>(0)
  const [loading, set_loading] = useState(false)

  const generate_invite_code = async () => {
    set_loading(true)

    const generated_code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()

    const expiry_time = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from("ponds")
      .update({
        invite_code: generated_code,
        invite_code_expiry: expiry_time,
      })
      .eq("id", pond_id)
      .select()
      .single()

    set_loading(false)

    if (error) {
      console.error(error)
      alert("Gagal membuat kode undangan")
      return
    }

    set_invite_code(data.invite_code)
    set_invite_code_expiry(data.invite_code_expiry)
  }

  useEffect(() => {
    if (!invite_code_expiry) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(invite_code_expiry).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        set_invite_code(null)
        set_invite_code_expiry(null)
        set_time_left(0)
        clearInterval(interval)
      } else {
        set_time_left(Math.floor(difference / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [invite_code_expiry])

  return (
    <div style={{ marginTop: 15 }}>
      <button
        onClick={generate_invite_code}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "GENERATE CODE"}
      </button>

      {invite_code && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "#f1f5f9",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h3>Kode Undangan</h3>
          <h2 style={{ letterSpacing: 3 }}>{invite_code}</h2>

          <div style={{ marginTop: 15 }}>
            <QRCode value={invite_code} size={180} />
          </div>

          <p style={{ marginTop: 10 }}>
            Berlaku {time_left} detik
          </p>
        </div>
      )}
    </div>
  )
}