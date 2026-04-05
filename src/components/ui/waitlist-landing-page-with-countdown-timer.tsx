"use client"

import React from "react"

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  QuadraticBezierCurve3,
  Vector3,
  TubeGeometry,
  ShaderMaterial,
  Mesh,
  AdditiveBlending,
  DoubleSide,
} from "three"
import type { ReactElement } from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/context/AppContext"
import { useAuth, useClerk } from "@clerk/nextjs"
import posthog from "posthog-js"

// Simple Accordion components for the FAQ since Shadcn is requested but we need something lightweight without complex install
const Accordion = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-4 w-full">{children}</div>;
}

const AccordionItem = ({ title, content }: { title: string, content: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border bg-card/90 backdrop-blur-md rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left text-foreground hover:bg-accent transition-colors font-medium"
      >
        {title}
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-muted-foreground border-t border-border mt-2">
          {content}
        </div>
      )}
    </div>
  );
}

export function WaitlistExperience(): ReactElement {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)

  const router = useRouter()
  const { updateOnboarding } = useApp()
  const [storeUrl, setStoreUrl] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  // Clerk hooks for auth state and sign-in modal
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { openSignIn } = useClerk()

  // After sign-in completes, check for a pending scan URL and auto-trigger
  useEffect(() => {
    if (!authLoaded || !isSignedIn) return
    const pendingUrl = localStorage.getItem("lr_pending_scan_url")
    if (pendingUrl) {
      setStoreUrl(pendingUrl)
      runMagicScan(pendingUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn])

  const runMagicScan = async (urlToScan: string) => {
    if (!urlToScan) return
    setIsScanning(true)
    posthog.capture("magic_scan_started", { url: urlToScan })

    try {
      const res = await fetch("/api/onboarding/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScan }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429 && data.redirectTo) {
          posthog.capture("magic_scan_rate_limited", { redirectTo: data.redirectTo })
          window.location.href = data.redirectTo + "?returnUrl=/terminal"
          return
        }
        throw new Error(data.error || "Failed to scan store")
      }

      // Update global onboarding state
      updateOnboarding({
        keywords: data.keywords || [],
        selectedCommunities: data.subreddits || [],
        oneMinuteBusinessPitch: data.businessDescription || "",
        completed: true,
      })

      posthog.capture("magic_scan_success", {
        keywords: data.keywords?.length,
        subreddits: data.subreddits?.length
      })

      // Clear pending URL — scan is done
      localStorage.removeItem("lr_pending_scan_url")

      // Redirect to the new Bloomberg terminal
      router.push("/terminal")
    } catch (error) {
      console.error("Magic scan failed:", error)
      const errorMsg = error instanceof Error ? error.message : "We couldn't analyze your store automatically. Please try again or check the URL.";
      alert(errorMsg)
    } finally {
      setIsScanning(false)
    }
  }

  const handleMagicScan = async () => {
    if (!storeUrl) return

    // Always save the URL first (survives sign-in redirect)
    localStorage.setItem("lr_pending_scan_url", storeUrl)

    // If not signed in, open Clerk modal — scan triggers automatically after sign-in via the useEffect above
    if (!isSignedIn) {
      posthog.capture("magic_scan_requires_signin", { url: storeUrl })
      openSignIn({ redirectUrl: "/" })
      return
    }

    // Already signed in — run the scan now
    await runMagicScan(storeUrl)
  }

  // Three.js background effect
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new Scene()
    sceneRef.current = scene

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    rendererRef.current = renderer

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0xfcfcfc, 1)
    mountRef.current.appendChild(renderer.domElement)

    // Create curved light geometry
    const curve = new QuadraticBezierCurve3(
      new Vector3(-15, -4, 0),
      new Vector3(2, 3, 0),
      new Vector3(18, 0.8, 0)
    )

    // Create tube geometry for the light streak
    const tubeGeometry = new TubeGeometry(curve, 200, 0.8, 32, false)

    // Create gradient material - MODIFIED FOR GREEN/BLACK THEME
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        // Create the gradient from mint to soft green
        vec3 color1 = vec3(0.447, 0.890, 0.678); // #72e3ad (Mint)
        vec3 color2 = vec3(0.290, 0.870, 0.500); // #4ade80 (Green-light)
        vec3 color3 = vec3(0.0, 0.385, 0.224); // #006239 (Deep green)
        
        // Mix colors based on UV coordinates
        vec3 finalColor = mix(color1, color2, vUv.x);
        finalColor = mix(finalColor, color3, vUv.x * 0.7);
        
        // Add glow effect
        float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
        glow = pow(glow, 2.0);
        
        float fade = 1.0;
        if (vUv.x > 0.85) {
          fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
        }
        
        // Add subtle animation
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        
        gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.8);
      }
    `

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
    })

    const lightStreak = new Mesh(tubeGeometry, material)
    scene.add(lightStreak)

    // Add additional glow layers for more realistic effect
    const glowGeometry = new TubeGeometry(curve, 200, 1.5, 32, false)
    const glowMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec3 color1 = vec3(0.447, 0.890, 0.678); // #72e3ad Mint
          vec3 color2 = vec3(0.0, 0.385, 0.224); // #006239 Deep green
          
          vec3 finalColor = mix(color1, color2, vUv.x);
          
          float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
          glow = pow(glow, 4.0);
          
          float fade = 1.0;
          if (vUv.x > 0.85) {
            fade = 1.0 - smoothstep(0.85, 1.0, vUv.x);
          }
          
          float pulse = sin(time * 1.5) * 0.05 + 0.95;
          
          gl_FragColor = vec4(finalColor * glow * pulse * fade, glow * fade * 0.3);
        }
      `,
      uniforms: {
        time: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
    })

    const glowLayer = new Mesh(glowGeometry, glowMaterial)
    scene.add(glowLayer)

    // Position camera
    camera.position.z = 7
    camera.position.y = -0.8

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const time = Date.now() * 0.001
      material.uniforms.time.value = time
      glowMaterial.uniforms.time.value = time

      // Subtle rotation for dynamic effect
      lightStreak.rotation.z = Math.sin(time * 0.2) * 0.05
      glowLayer.rotation.z = Math.sin(time * 0.2) * 0.05

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return

      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }

      renderer.dispose()
      tubeGeometry.dispose()
      glowGeometry.dispose()
      material.dispose()
      glowMaterial.dispose()
    }
  }, [])



  return (
    <main className="relative min-h-screen bg-background w-full font-sans selection:bg-primary/30">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Content Layer */}
      <div className="relative z-10 w-full flex flex-col items-center">

        {/* HERO SECTION */}
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen px-4 w-full text-center max-w-4xl mx-auto pt-20">
          <p className="text-foreground/60 tracking-[0.2em] uppercase text-xs md:text-sm mb-6 font-medium">
            E-Commerce Management System
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Your Brand&apos;s Command Center
            <br />
            <span className="text-primary">Powered by AI</span>
          </h1>

          <p className="text-foreground/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Enter your store URL and get a Bloomberg-style terminal with real-time brand intelligence, AI-powered Reddit engagement, and growth insights.
          </p>

          <div className="mt-4 mb-4 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row w-full gap-2 p-2 bg-card border border-border rounded-xl backdrop-blur-md mb-4 shadow-md">
              <input
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMagicScan()}
                placeholder="Enter your store URL"
                className="flex-1 bg-transparent border-none outline-none text-foreground px-4 h-12 text-base md:text-lg placeholder:text-muted-foreground w-full"
              />
              <button
                onClick={handleMagicScan}
                disabled={!storeUrl || isScanning}
                className="w-full sm:w-auto px-6 h-12 bg-primary hover:brightness-110 disabled:opacity-50 text-primary-foreground font-bold rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(114,227,173,0.3)] hover:shadow-[0_0_25px_rgba(114,227,173,0.5)] text-lg tracking-wide flex items-center justify-center whitespace-nowrap min-w-[120px]"
              >
                {isScanning ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    Scanning...
                  </div>
                ) : (
                  "Magic Scan"
                )}
              </button>
            </div>

            <Link
              href="https://calendar.app.google/7a88C2bCKpKmzeik6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-2 text-foreground/50 hover:text-foreground/90 font-medium rounded-lg transition-all duration-300 text-sm tracking-wide flex items-center justify-center"
            >
              Or Book a Demo →
            </Link>
          </div>

          <p className="text-foreground/50 text-sm md:text-base max-w-2xl mx-auto mt-6">
            Reddit is where half of all online purchase conversations happen. Your customers are there right now describing what they want, what frustrates them, and what they would pay for. LegitReach finds those conversations for you, automatically.
          </p>
        </div>

        {/* HOW IT WORKS SECTION */}
        <div className="w-full max-w-6xl mx-auto px-4 py-24 z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
            How LegitReach Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Tell Us About Your Brand</h3>
              <p className="text-muted-foreground">
                Describe your ecommerce product, your target customer, and the problems you solve. Our AI builds a personalized model of your ideal buyer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Scans Reddit Daily</h3>
              <p className="text-muted-foreground">
                Your agent monitors relevant subreddits (r/ecommerce, r/skincare, r/supplements, r/DTC, and thousands more) looking for discussions that match your customer profile.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Get Insights You Can Use</h3>
              <p className="text-muted-foreground">
                Every day, you get a set of pain points, product requests, competitor mentions, and buying signals with direct links into each conversation.
              </p>
            </div>
          </div>
        </div>

        {/* WHY REDDIT SECTION */}
        <div className="w-full max-w-3xl mx-auto px-4 py-16 z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Why Reddit Is Your Best Customer Research Channel
          </h2>
          <p className="text-muted-foreground text-lg">
            Reddit is where your customers go to ask for honest recommendations, complain about products that fall short, and describe exactly what they would pay for, in their own words. Most ecommerce brands are not paying attention. LegitReach makes sure you are.
          </p>
        </div>

        {/* BUILT FOR ECOMMERCE SECTION */}
        <div className="w-full max-w-6xl mx-auto px-4 py-24 z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
            Built for Ecommerce Brands
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Product Research</h3>
              <p className="text-muted-foreground">
                Find out what customers wish your competitors made. Spot feature requests and unmet needs before anyone else does.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Customer Pain Points</h3>
              <p className="text-muted-foreground">
                See the exact words your customers use to describe their problems. Put that language in your ads, landing pages, and product copy.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Competitor Intelligence</h3>
              <p className="text-muted-foreground">
                Know what people love and hate about competing products. Find the gaps you can fill and the objections you need to handle.
              </p>
            </div>
          </div>
        </div>

        {/* SOCIAL PROOF LINE */}
        <div className="w-full max-w-3xl mx-auto px-4 pb-8 z-10 text-center">
          <p className="text-foreground/40 text-sm">
            Trusted by early stage ecommerce brands finding out what their customers actually want.
          </p>
        </div>

        {/* FAQ SECTION */}
        <div className="w-full max-w-3xl mx-auto px-4 py-24 z-10">
          <h2 className="text-4xl font-bold text-primary text-center mb-12 uppercase tracking-widest">
            FAQ
          </h2>

          <Accordion>
            <AccordionItem
              title="What is LegitReach?"
              content="LegitReach is an E-Commerce Management System (EMS) presented as a Bloomberg-style terminal. It centralizes real-time brand intelligence, tracks dynamic growth metrics, and utilizes autonomous AI agents to continuously scout the internet for actionable opportunities."
            />
            <AccordionItem
              title="How does the Bloomberg-style terminal work?"
              content="Just like financial professionals use a terminal to monitor markets, LegitReach gives you a live, consolidated feed of everything happening around your brand. Instead of jumping between tabs, you get instant monitoring of news trends, integrated analytics (coming soon), and active AI agents all in one unified, data-dense view."
            />
            <AccordionItem
              title="What do the AI agents actually do?"
              content="Our agents are designed to take action. For example, our Reddit Agent monitors conversations 24/7 to find highly relevant discussions where your brand can step in. It discovers customer pain points, competitor complaints, and buying signals across thousands of subreddits, pulling actionable intelligence directly into your terminal."
            />
            <AccordionItem
              title="Is it really free?"
              content="Yes. You can launch your EMS terminal and start the AI agents completely for free right now. We are actively building LegitReach alongside early adopting e-commerce brands, so early users get full access."
            />
          </Accordion>
        </div>

      </div>
    </main>
  )
}
