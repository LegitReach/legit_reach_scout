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
import posthog from "posthog-js"

// Simple Accordion components for the FAQ since Shadcn is requested but we need something lightweight without complex install
const Accordion = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-4 w-full">{children}</div>;
}

const AccordionItem = ({ title, content }: { title: string, content: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/20 bg-black/60 backdrop-blur-md rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left text-white/90 hover:bg-white/5 transition-colors font-medium"
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
        <div className="p-4 pt-0 text-white/70 border-t border-white/10 mt-2">
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

  const handleMagicScan = async () => {
    if (!storeUrl) return
    setIsScanning(true)
    posthog.capture("magic_scan_started", { url: storeUrl })

    try {
      const res = await fetch("/api/onboarding/magic-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: storeUrl }),
      })

      if (!res.ok) throw new Error("Failed to scan store")

      const data = await res.json()

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

      // Redirect directly to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Magic scan failed:", error)
      alert("We couldn't analyze your store automatically. Please try again or check the URL.")
    } finally {
      setIsScanning(false)
    }
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
    renderer.setClearColor(0x000000, 1)
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
        // Create the gradient from bright green to deep green
        vec3 color1 = vec3(0.13, 0.77, 0.36); // #22c55e (Tailwind green-500)
        vec3 color2 = vec3(0.08, 0.62, 0.52); // Teal
        vec3 color3 = vec3(0.02, 0.25, 0.15); // Deep dark green
        
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
          vec3 color1 = vec3(0.13, 0.77, 0.36); // Green
          vec3 color2 = vec3(0.00, 0.50, 0.20); // Darker Green
          
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
    <main className="relative min-h-screen bg-black w-full font-sans selection:bg-green-500/30">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Content Layer */}
      <div className="relative z-10 w-full flex flex-col items-center">

        {/* HERO SECTION */}
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen px-4 w-full text-center max-w-4xl mx-auto pt-20">
          <p className="text-white/60 tracking-[0.2em] uppercase text-xs md:text-sm mb-6 font-medium">
            Reddit Customer Insights for Ecommerce Brands
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Find Your Ideal Customer Insights on Reddit
            <br />
            <span className="text-green-500">For Free</span>
          </h1>

          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8">
            An AI agent built around your ecommerce brand. It reads Reddit the way your ideal customer would, picking up pain points, product requests, and competitor gaps you can act on today.
          </p>

          <div className="mt-4 mb-4 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md mx-auto">
            <div className="flex w-full gap-2 p-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <input
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMagicScan()}
                placeholder="Enter your store URL (e.g. mystore.com)"
                className="flex-1 bg-transparent border-none outline-none text-white px-4 h-12 text-lg placeholder:text-white/30"
              />
              <button
                onClick={handleMagicScan}
                disabled={!storeUrl || isScanning}
                className="px-6 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black font-bold rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] text-lg tracking-wide flex items-center justify-center whitespace-nowrap min-w-[120px]"
              >
                {isScanning ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    Scanning...
                  </div>
                ) : (
                  "Magic Scan ✨"
                )}
              </button>
            </div>

            <Link
              href="https://calendar.app.google/7a88C2bCKpKmzeik6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-2 text-white/50 hover:text-white/90 font-medium rounded-lg transition-all duration-300 text-sm tracking-wide flex items-center justify-center"
            >
              Or Book a Demo →
            </Link>
          </div>

          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mt-6">
            Reddit is where half of all online purchase conversations happen. Your customers are there right now describing what they want, what frustrates them, and what they would pay for. LegitReach finds those conversations for you, automatically.
          </p>
        </div>

        {/* HOW IT WORKS SECTION */}
        <div className="w-full max-w-6xl mx-auto px-4 py-24 z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            How LegitReach Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Tell Us About Your Brand</h3>
              <p className="text-white/70">
                Describe your ecommerce product, your target customer, and the problems you solve. Our AI builds a personalized model of your ideal buyer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">AI Scans Reddit Daily</h3>
              <p className="text-white/70">
                Your agent monitors relevant subreddits (r/ecommerce, r/skincare, r/supplements, r/DTC, and thousands more) looking for discussions that match your customer profile.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Get Insights You Can Use</h3>
              <p className="text-white/70">
                Every day, you get a set of pain points, product requests, competitor mentions, and buying signals with direct links into each conversation.
              </p>
            </div>
          </div>
        </div>

        {/* WHY REDDIT SECTION */}
        <div className="w-full max-w-3xl mx-auto px-4 py-16 z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Why Reddit Is Your Best Customer Research Channel
          </h2>
          <p className="text-white/70 text-lg">
            Reddit is where your customers go to ask for honest recommendations, complain about products that fall short, and describe exactly what they would pay for, in their own words. Most ecommerce brands are not paying attention. LegitReach makes sure you are.
          </p>
        </div>

        {/* BUILT FOR ECOMMERCE SECTION */}
        <div className="w-full max-w-6xl mx-auto px-4 py-24 z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            Built for Ecommerce Brands
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-500 mb-4">Product Research</h3>
              <p className="text-white/70">
                Find out what customers wish your competitors made. Spot feature requests and unmet needs before anyone else does.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-500 mb-4">Customer Pain Points</h3>
              <p className="text-white/70">
                See the exact words your customers use to describe their problems. Put that language in your ads, landing pages, and product copy.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-500 mb-4">Competitor Intelligence</h3>
              <p className="text-white/70">
                Know what people love and hate about competing products. Find the gaps you can fill and the objections you need to handle.
              </p>
            </div>
          </div>
        </div>

        {/* SOCIAL PROOF LINE */}
        <div className="w-full max-w-3xl mx-auto px-4 pb-8 z-10 text-center">
          <p className="text-white/50 text-sm">
            Trusted by early stage ecommerce brands finding out what their customers actually want.
          </p>
        </div>

        {/* FAQ SECTION */}
        <div className="w-full max-w-3xl mx-auto px-4 py-24 z-10">
          <h2 className="text-4xl font-bold text-green-500 text-center mb-12 uppercase tracking-widest">
            FAQ
          </h2>

          <Accordion>
            <AccordionItem
              title="What is LegitReach?"
              content="LegitReach is an AI agent built for ecommerce brands. It monitors Reddit around the clock to find real customer insights personalized to your brand. Think of it as a version of your ideal customer scanning Reddit 24/7, pulling up discussions where people talk about problems your product solves, features they wish existed, and competitors they are frustrated with."
            />
            <AccordionItem
              title="How is this different from manually searching Reddit or using alerts?"
              content="Manual searches return keyword matches. LegitReach returns context. Our AI understands your brand, your product category, and your customer profile. It does not just find posts that contain your keywords. It finds posts where someone is describing a problem your product solves, even if they never mention your category by name. It is the difference between searching for 'skincare' and finding someone saying 'my face breaks out every winter and nothing helps.'"
            />
            <AccordionItem
              title="What kind of insights will I get?"
              content="Every day you get Reddit discussions organized by type: customer pain points (what frustrates people), product requests (what people wish existed), competitor mentions (what people say about alternatives), and buying signals (people actively looking for a solution). Each insight links directly to the original Reddit thread so you can read the full context or engage."
            />
            <AccordionItem
              title="Is it really free?"
              content="Yes. Daily Reddit insights personalized to your brand are completely free. We are building LegitReach for ecommerce brands that want to understand their customers better, and now is the best time to join while we shape the product around early user feedback."
            />
          </Accordion>
        </div>

      </div>
    </main>
  )
}
