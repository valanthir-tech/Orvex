"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadPaymentProof } from "@/app/actions/storefront"
import { type PaymentQrCode } from "@/app/actions/subscriptions"
import { toast } from "sonner"
import { CheckCircle, Upload, Wallet, Building, Copy } from "lucide-react"

export function PaymentUpload({ currentPlan, qrCodes }: { currentPlan: string, qrCodes?: PaymentQrCode[] }) {
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()
  
  let fee = 5000
  if (currentPlan === "growth") fee = 15000
  if (currentPlan === "pro") fee = 30000

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return toast.error("Please upload a payment screenshot")
    
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.append("amount", fee.toString())
      await uploadPaymentProof(formData)
      toast.success("Payment submitted for verification!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Define details from the database or fallbacks
  const esewaCodes = qrCodes?.filter((q) => q.payment_method === "esewa" && q.is_active) || []
  const bankCodes = qrCodes?.filter((q) => q.payment_method === "bank_transfer" && q.is_active) || []

  return (
    <div className="py-2 grid lg:grid-cols-2 gap-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Complete Your Payment</h2>
        <p className="text-muted-foreground mb-8">
          Please transfer <strong className="text-foreground">Rs.{fee.toLocaleString()}</strong> using any of the methods below, then submit your screenshot.
        </p>

        <div className="space-y-6">
          {/* FonePay/eSewa Wallet Box */}
          {esewaCodes.map((esewa, idx) => (
             <Card key={idx} className="bg-secondary/50">
               <CardHeader className="pb-2">
                 <CardTitle className="text-lg flex items-center">
                    <Wallet className="w-5 h-5 mr-2"/> Mobile Wallet (eSewa / Khalti)
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {Object.entries(esewa.payment_details || {}).map(([key, value]) => (
                   <div key={key} className="flex justify-between items-center bg-background p-3 rounded-md border">
                     <div>
                       <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                       <p className="font-mono font-medium">{value as string}</p>
                     </div>
                     <Button size="icon" variant="ghost" onClick={() => handleCopy(value as string)}>
                        <Copy className="w-4 h-4"/>
                     </Button>
                   </div>
                 ))}
               </CardContent>
             </Card>
          ))}

          {/* Bank Transfer Box */}
          {bankCodes.map((bank, idx) => (
             <Card key={idx} className="bg-secondary/50">
               <CardHeader className="pb-2">
                 <CardTitle className="text-lg flex items-center">
                    <Building className="w-5 h-5 mr-2"/> Bank Transfer
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(bank.payment_details || {}).map(([key, value]) => (
                     <div key={key} className="bg-background p-3 rounded-md border relative">
                       <p className="text-xs text-muted-foreground mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                       <p className="text-sm font-medium truncate pr-8">{value as string}</p>
                       <Button className="absolute top-1/2 -translate-y-1/2 right-1" size="icon" variant="ghost" onClick={() => handleCopy(value as string)}>
                          <Copy className="w-4 h-4"/>
                       </Button>
                     </div>
                    ))}
                 </div>
               </CardContent>
             </Card>
          ))}
          
          {(!esewaCodes.length && !bankCodes.length) && (
              <p className="text-muted-foreground text-sm border p-4 rounded-xl mb-4 bg-muted/20">
                  Please contact the admin for payment method details.
              </p>
          )}

        </div>
      </div>

      <div>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>Submit Payment Proof</CardTitle>
            <CardDescription>Upload your transaction receipt to begin the build process.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select name="method" required defaultValue="esewa">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash / Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Transaction Reference / Remarks</Label>
                <Input id="reference" name="reference" placeholder="e.g. TXN-984321A" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Payment Screenshot</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                  <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                  <Input 
                    id="file" 
                    name="file" 
                    type="file" 
                    className="max-w-[250px]" 
                    accept="image/*,.pdf" 
                    required 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && <p className="text-xs text-green-500 mt-3 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> {file.name} attached.</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Uploading..." : "Submit Payment for Verification"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
