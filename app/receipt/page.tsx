"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FormationCertificate } from "../../components/receipt/FormationCertificate";
import { useFormation } from "../../lib/formation-context";
export default function ReceiptPage() { const { formed } = useFormation(); return <div className="page receipt-page"><div className="page-heading centered"><span className="eyebrow">PROOF VIEW · {formed ? "VERIFIED" : "PENDING"}</span><h1>Formation Receipt</h1><p>A durable-looking record of the moment two interpretations became one agreed object.</p></div><FormationCertificate /><div className="receipt-nav"><Link className="button ghost" href="/ratification"><ArrowLeft size={15} />Back to ratification</Link><Link className="button subtle" href="/workspace">Start another agreement <ArrowRight size={15} /></Link></div></div>; }
