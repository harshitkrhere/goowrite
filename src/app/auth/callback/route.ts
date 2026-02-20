import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);

    // Handle OAuth callback (code) or email confirmation (token_hash)
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    // For password recovery, redirect to reset-password page
    const defaultNext = type === "recovery" ? "/reset-password" : "/dashboard";

    // Validate `next` to prevent open redirect attacks.
    // Only allow relative paths starting with "/" and block protocol-relative URLs ("//evil.com").
    const rawNext = searchParams.get("next");
    const next =
        (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//"))
            ? rawNext
            : defaultNext;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Can't set cookies in this context
                    }
                },
            },
        },
    );

    // Handle email confirmation (token_hash + type)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "email" | "recovery" | "invite",
        });

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        console.error("Email verification error:", error);
        return NextResponse.redirect(
            `${origin}/login?error=verification_failed`,
        );
    }

    // Handle OAuth callback (code)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        console.error("OAuth error:", error);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // No valid auth params
    return NextResponse.redirect(`${origin}/login?error=invalid_callback`);
}
