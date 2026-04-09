import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const signupId = formData.get('signupId') as string;
        const planId = formData.get('planId') as string;
        const paymentReference = formData.get('paymentReference') as string;
        // const paymentMethod = formData.get('paymentMethod') as string;
        const proofFile = formData.get('proofFile') as File | null;

        if (!signupId || !planId) {
            return NextResponse.json(
                { success: false, error: 'Missing signup ID or Plan ID' },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let publicUrl = null;

        if (proofFile) {
            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
            const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

            if (!ALLOWED_TYPES.includes(proofFile.type)) {
                return NextResponse.json({ success: false, error: 'Invalid file type.' }, { status: 400 });
            }
            if (proofFile.size > MAX_SIZE_BYTES) {
                return NextResponse.json({ success: false, error: 'File is too large.' }, { status: 400 });
            }

            const fileExt = proofFile.name.split('.').pop();
            const datePart = new Date().toISOString().slice(0, 10);
            const fileName = `signup_${signupId}_${datePart}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(fileName, proofFile, {
                    contentType: proofFile.type,
                    upsert: true,
                });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const { data: urlData } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(fileName);
            publicUrl = urlData.publicUrl;
        }

        const payload = {
            payment_reference: paymentReference || null,
            payment_proof_url: publicUrl || null,
            plan_id: planId,
            status: 'pending_approval'
        };

        const { data, error } = await supabase
            .from('tenant_signups')
            .update(payload)
            .eq('id', signupId)
            .eq('status', 'pending_payment')
            .select()
            .single();

        if (error || !data) {
            console.error('[Payment Update] Database error saving payment info:', error);
            
            return NextResponse.json(
                { success: false, error: 'Database error saving payment: ' + (error?.message || 'Not found') },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, signupId: data.id, message: "Payment info saved. Queued for approval." },
            { status: 200 }
        );

    } catch (err: any) {
        console.error('[Payment info] Processing error:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
