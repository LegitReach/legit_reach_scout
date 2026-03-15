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

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export function WaitlistExperience(): ReactElement {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)

  const [showForm, setShowForm] = useState(false)

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

  const handleGetAccess = () => {
    setShowForm(true);
    // Smooth scroll to form section, aligning the bottom of the container to the bottom of the viewport
    setTimeout(() => {
        const formEl = document.getElementById("signup-form");
        if (formEl) {
          formEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, 150);
  }

  // To properly embed the external script without React throwing hydration errors
  useEffect(() => {
    if (showForm) {
      const script = document.createElement("script");
      script.src = "https://links.legitreach.com/js/form_embed.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [showForm]);

  return (
    <main className="relative min-h-screen bg-black w-full font-sans selection:bg-green-500/30">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Content Layer */}
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {/* HERO SECTION */}
        <div className="flex flex-col flex-1 items-center justify-center min-h-screen px-4 w-full text-center max-w-4xl mx-auto pt-20">
          <p className="text-white/60 tracking-[0.2em] uppercase text-xs md:text-sm mb-6 font-medium">
            NEWSLETTERS ARE DEAD. INSTEAD, GET LEGITREACH
          </p>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
            AI-POWERED NEWSLETTER THAT GETS YOU <span className="text-green-500">LEGIT</span>REACH
          </h1>
          
          <div className="mt-4 mb-4">
            <Button
              onClick={handleGetAccess}
              className="h-12 px-8 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] text-lg uppercase tracking-wide border-none"
            >
              Get Early Access
            </Button>
          </div>
          
          <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto mt-6">
            Stop juggling newsletters. Single information digest with frictionless actions daily.
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
              content="LegitReach is an AI-powered platform that transforms standard information digests into actionable opportunities. We curate the best conversations across Reddit so you can jump in and engage with your target audience frictionlessly."
            />
            <AccordionItem 
              title="How is this different from just subscribing to newsletters?" 
              content="Newsletters are passive reading. LegitReach curates real, live conversations happening right now that are highly relevant to your business, and provides AI-drafted responses so you can instantly take action instead of just reading."
            />
            <AccordionItem 
              title="What does 'frictionless actions' mean?" 
              content="Instead of spending hours searching for relevant discussions and drafting replies, LegitReach delivers the opportunities to your dashboard and prepares tailored AI drafts. You just review, click, and post."
            />
            <AccordionItem 
              title="Is early access free?" 
              content="Yes, our early access program is entirely free while we gather feedback and refine our features. Join the waitlist today to secure your spot."
            />
          </Accordion>
        </div>

        {/* FORM SECTION */}
        {showForm && (
            <div id="signup-form" className="w-full max-w-xl mx-auto px-4 pb-32 pt-12 z-10 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="rounded-2xl overflow-hidden border border-white/20 bg-white shadow-2xl relative">
                    {/* Top Image Cover */}
                    <div className="relative h-64 w-full">
                        <img 
                            src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1200" 
                            alt="Typing on a retro typewriter" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                            <h3 className="text-white font-bold text-3xl md:text-4xl tracking-tight leading-snug drop-shadow-lg">
                                LET'S MAKE WORDS<br />WORK FOR YOU
                            </h3>
                        </div>
                    </div>
                    
                    {/* Embedded Form Content */}
                    <div className="bg-white p-2">
                        <iframe
                            src="https://links.legitreach.com/widget/form/ffY9J3zMF6VRmZs2ZKEs"
                            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0px', minHeight: '665px' }}
                            id="inline-ffY9J3zMF6VRmZs2ZKEs" 
                            data-layout="{'id':'INLINE'}"
                            data-trigger-type="alwaysShow"
                            data-trigger-value=""
                            data-activation-type="alwaysActivated"
                            data-activation-value=""
                            data-deactivation-type="neverDeactivate"
                            data-deactivation-value=""
                            data-form-name="LegitReach Signup"
                            data-height="665"
                            data-layout-iframe-id="inline-ffY9J3zMF6VRmZs2ZKEs"
                            data-form-id="ffY9J3zMF6VRmZs2ZKEs"
                            title="LegitReach Signup"
                        />
                    </div>
                </div>
            </div>
        )}

      </div>
    </main>
  )
}
