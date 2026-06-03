"use client";

import React from 'react';

interface Product {
  name: string;
  price: number;
  originalPrice: number;
  image: string;
}

const products: Product[] = [
  {
    name: "The Classic",
    price: 120,
    originalPrice: 200,
    image: "https://i.postimg.cc/1zN0rTcN/img-1.jpg"
  },
  {
    name: "The Camper",
    price: 80,
    originalPrice: 200,
    image: "https://i.postimg.cc/zGQSW-5Wk/img-2.jpg"
  },
  {
    name: "The Couple",
    price: 150,
    originalPrice: 200,
    image: "https://i.postimg.cc/Bv15BycF/img-3.jpg"
  },
  {
    name: "The Ridge",
    price: 70,
    originalPrice: 200,
    image: "https://i.postimg.cc/tgVdNftx/img-4.jpg"
  },
  {
    name: "Dreams",
    price: 60,
    originalPrice: 200,
    image: "https://i.postimg.cc/0NJG03dm/img-5.jpg"
  },
  {
    name: "Van Life",
    price: 110,
    originalPrice: 200,
    image: "https://i.postimg.cc/YSmNzVfY/img-6.jpg"
  },
  {
    name: "The Bold",
    price: 140,
    originalPrice: 200,
    image: "https://i.postimg.cc/KYg7DVrt/img-7.jpg"
  },
  {
    name: "The Traveler",
    price: 180,
    originalPrice: 200,
    image: "https://i.postimg.cc/9fqPYStG/img-8.jpg"
  },
  {
    name: "The Savor",
    price: 50,
    originalPrice: 200,
    image: "https://i.postimg.cc/25Bd7JFQ/img-9.jpg"
  }
];

export default function LandingPage({ setActiveView }: { setActiveView: (view: string) => void }) {
  return (
    <div className="min-h-screen text-base font-normal text-[#090909] px-3.5 pt-3.5 bg-white font-sans overflow-x-hidden relative">
      
      {/* 🚀 Interactive Banner back to app */}
      <div className="max-w-5xl mx-auto bg-black text-white text-[11px] font-bold uppercase tracking-widest text-center py-2 rounded-t-xl flex items-center justify-center gap-2 select-none shadow-md">
        <span>🚀 TRADINGSAFE PREVIEW MODE</span>
        <span className="text-slate-400">|</span>
        <button 
          onClick={() => setActiveView('overview')}
          className="text-[#F1BF0A] hover:underline cursor-pointer bg-transparent border-none p-0 inline font-bold uppercase tracking-widest text-[11px]"
        >
          LAUNCH SECURE DASHBOARD &rarr;
        </button>
      </div>

      {/* 1. Neoclassic Navbar Header */}
      <nav className="flex items-center justify-between max-w-5xl mx-auto relative z-5 overflow-hidden">
        <div 
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-1.5 bg-white px-5 rounded-br-4xl relative after:content-[''] after:absolute after:bg-[#183fad] after:w-1/2 after:h-1/2 after:-bottom-1 after:-right-1 after:-z-[5] self-stretch w-full max-w-45 cursor-pointer"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="6" fill="#F1BF0A" />
            <path d="M15.3414 14.7356C15.4039 15.1058 15.726 15.3846 16.1106 15.3846H16.9039C17.375 15.3846 17.75 14.976 17.6875 14.5192C17.5048 13.1635 16.899 11.9135 15.9279 10.9279C15.2356 10.2212 14.7933 9.32692 14.6587 8.35577C14.6058 7.97596 14.2789 7.69231 13.8846 7.69231H13.0962C12.625 7.69231 12.2596 8.10096 12.3125 8.55769C12.5 10.0913 13.1779 11.5048 14.2644 12.6154C14.8414 13.2019 15.2115 13.9375 15.3414 14.7356ZM20.726 14.7356C20.7885 15.1058 21.1106 15.3846 21.4952 15.3846H22.2885C22.7596 15.3846 23.1346 14.976 23.0721 14.5192C22.8894 13.1635 22.2837 11.9135 21.3125 10.9279C20.6202 10.2212 20.1779 9.32692 20.0433 8.35577C19.9904 7.97596 19.6635 7.69231 19.2692 7.69231H18.4808C18.0096 7.69231 17.6394 8.10096 17.6971 8.55769C17.8846 10.0913 18.5625 11.5048 19.649 12.6154C20.226 13.2019 20.5962 13.9375 20.726 14.7356ZM28.4615 16.9231H10.7692C9.91827 16.9231 9.23077 17.6106 9.23077 18.4615V27.6923C9.23077 30.2404 11.2981 32.3077 13.8462 32.3077H23.0769C25.625 32.3077 27.6923 30.2404 27.6923 27.6923H28.4615C31.4327 27.6923 33.8462 25.2788 33.8462 22.3077C33.8462 19.3365 31.4327 16.9231 28.4615 16.9231ZM28.4615 24.6154H27.6923V20H28.4615C29.7356 20 30.7692 21.0337 30.7692 22.3077C30.7692 23.5817 29.7356 24.6154 28.4615 24.6154Z" fill="#090909" />
          </svg>
          <span className="font-anton select-none text-[13px] tracking-wider text-[#090909]">MUGSY'S MUGS</span>
        </div>

        <div className="flex items-center justify-end min-[480px]:justify-between gap-4 flex-1 bg-[#183fad] text-white p-3.5 rounded-t-4xl">
          <div className="hidden md:block"></div>

          <ul className="hidden md:flex items-center gap-6 py-2.5">
            <li><button onClick={() => setActiveView('landing')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none font-semibold text-sm">Home</button></li>
            <li><button onClick={() => setActiveView('overview')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none font-semibold text-sm text-slate-300">Dashboard</button></li>
            <li><button onClick={() => setActiveView('chat')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none font-semibold text-sm text-slate-300">Concierge</button></li>
            <li><button onClick={() => setActiveView('api-key')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none font-semibold text-sm text-slate-300">API Key</button></li>
          </ul>

          <button 
            type="button" 
            onClick={() => setActiveView('overview')}
            className="md:hidden cursor-pointer rounded" 
            aria-label="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-9">
              <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Interactive Explore Collection CTA Button */}
          <button 
            onClick={() => setActiveView('overview')}
            className="hidden min-[480px]:flex items-center gap-2 bg-[#F1BF0A] rounded-full py-1.5 pl-1.5 pr-4 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.5 after:rounded-full after:bg-white after:h-9 after:w-9 hover:after:w-full after:transition-[width] after:duration-[1600ms] after:ease-[linear(0,0.029_0.8%,0.13_1.8%,0.908_7.2%,1.051_9.1%,1.112_11.2%,1.116_12.2%,1.106_13.4%,1.007_19.5%,0.987_23.1%,1.001_35%,1)] overflow-hidden hover:after:h-full hover:after:left-0 cursor-pointer border border-[#F1BF0A]"
          >
            <div className="rounded-full p-1.5 relative z-10 bg-white/10 text-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
              </svg>
            </div>
            <span className="relative z-10 font-bold text-sm">Explore Collection</span>
          </button>
        </div>
      </nav>

      {/* 2. Neoclassic Header with Huge spelling of MUGSY'S */}
      <header className="max-w-5xl mx-auto bg-[#183fad] text-white px-3.5 pb-3.5 pt-8 sm:pt-14 rounded-tl-4xl rounded-b-4xl relative z-0 overflow-hidden">
        
        {/* Spelling of "MUGSY'S" */}
        <svg viewBox="0 0 39 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto max-w-[60rem] object-contain w-full">
          <path d="M0 10.418V0.105469H3.14062L4.00781 6.39258L4.86914 0.105469H8.03906V10.418H6.15234V2.98828L4.96875 10.418H3.11719L1.86328 2.98828V10.418H0Z" fill="white" />
          <path d="M11.3379 10.5117C10.4785 10.5117 9.8457 10.2715 9.43945 9.79102C9.0332 9.30664 8.83008 8.5957 8.83008 7.6582V0.105469H10.834V7.57617C10.834 7.74805 10.8438 7.91406 10.8633 8.07422C10.8828 8.23047 10.9277 8.35938 10.998 8.46094C11.0684 8.5625 11.1816 8.61328 11.3379 8.61328C11.498 8.61328 11.6133 8.56445 11.6836 8.4668C11.7539 8.36523 11.7969 8.23438 11.8125 8.07422C11.832 7.91406 11.8418 7.74805 11.8418 7.57617V0.105469H13.8457V7.6582C13.8457 8.5957 13.6426 9.30664 13.2363 9.79102C12.8301 10.2715 12.1973 10.5117 11.3379 10.5117Z" fill="white" />
          <path d="M16.7637 10.5117C15.291 10.5117 14.5547 9.45703 14.5547 7.34766V2.90039C14.5547 0.974609 15.3984 0.0117188 17.0859 0.0117188C17.7812 0.0117188 18.3145 0.152344 18.6855 0.433594C19.0566 0.710938 19.3125 1.11719 19.4531 1.65234C19.5938 2.1875 19.6641 2.83984 19.6641 3.60938H17.6484V2.69531C17.6484 2.47266 17.6172 2.28711 17.5547 2.13867C17.4961 1.98633 17.3711 1.91016 17.1797 1.91016C16.9414 1.91016 16.7832 1.99023 16.7051 2.15039C16.6309 2.31055 16.5938 2.48633 16.5938 2.67773V7.67578C16.5938 7.95312 16.6289 8.17969 16.6992 8.35547C16.7734 8.52734 16.916 8.61328 17.127 8.61328C17.3457 8.61328 17.4902 8.52734 17.5605 8.35547C17.6348 8.17969 17.6719 7.94922 17.6719 7.66406V6.19336H17.1211V4.41211H19.6406V10.418H18.8145L18.4629 9.55078C18.1035 10.1914 17.5371 10.5117 16.7637 10.5117Z" fill="white" />
          <path d="M22.9102 10.5117C21.9688 10.5117 21.2891 10.2773 20.8711 9.80859C20.457 9.33984 20.25 8.59375 20.25 7.57031V6.5625H22.2891V7.85156C22.2891 8.08984 22.3242 8.27734 22.3945 8.41406C22.4688 8.54688 22.5957 8.61328 22.7754 8.61328C22.9629 8.61328 23.0918 8.55859 23.1621 8.44922C23.2363 8.33984 23.2734 8.16016 23.2734 7.91016C23.2734 7.59375 23.2422 7.33008 23.1797 7.11914C23.1172 6.9043 23.0078 6.70117 22.8516 6.50977C22.6992 6.31445 22.4863 6.08789 22.2129 5.83008L21.2871 4.95117C20.5957 4.29883 20.25 3.55273 20.25 2.71289C20.25 1.83398 20.4531 1.16406 20.8594 0.703125C21.2695 0.242188 21.8613 0.0117188 22.6348 0.0117188C23.5801 0.0117188 24.25 0.263672 24.6445 0.767578C25.043 1.27148 25.2422 2.03711 25.2422 3.06445H23.1445V2.35547C23.1445 2.21484 23.1035 2.10547 23.0215 2.02734C22.9434 1.94922 22.8359 1.91016 22.6992 1.91016C22.5352 1.91016 22.4141 1.95703 22.3359 2.05078C22.2617 2.14062 22.2246 2.25781 22.2246 2.40234C22.2246 2.54688 22.2637 2.70312 22.3418 2.87109C22.4199 3.03906 22.5742 3.23242 22.8047 3.45117L23.9941 4.59375C24.2324 4.82031 24.4512 5.06055 24.6504 5.31445C24.8496 5.56445 25.0098 5.85742 25.1309 6.19336C25.252 6.52539 25.3125 6.93164 25.3125 7.41211C25.3125 8.38086 25.1328 9.14062 24.7734 9.69141C24.418 10.2383 23.7969 10.5117 22.9102 10.5117Z" fill="white" />
          <path d="M27.252 10.418V7.02539L25.6055 0.105469H27.6504L28.2246 3.59766L28.7988 0.105469H30.8379L29.1973 7.02539V10.418H27.252Z" fill="white" />
          <path d="M31.5527 3.12891L31.9395 1.74609H31.1953V0H33.3867V1.69336L32.7891 3.12891H31.5527Z" fill="white" />
          <path d="M36.5977 10.5117C35.6562 10.5117 34.9766 10.2773 34.5586 9.80859C34.1445 9.33984 33.9375 8.59375 33.9375 7.57031V6.5625H35.9766V7.85156C35.9766 8.08984 36.0117 8.27734 36.082 8.41406C36.1562 8.54688 36.2832 8.61328 36.4629 8.61328C36.6504 8.61328 36.7793 8.55859 36.8496 8.44922C36.9238 8.33984 36.9609 8.16016 36.9609 7.91016C36.9609 7.59375 36.9297 7.33008 36.8672 7.11914C36.8047 6.9043 36.6953 6.70117 36.5391 6.50977C36.3867 6.31445 36.1738 6.08789 35.9004 5.83008L34.9746 4.95117C34.2832 4.29883 33.9375 3.55273 33.9375 2.71289C33.9375 1.83398 34.1406 1.16406 34.5469 0.703125C34.957 0.242188 35.5488 0.0117188 36.3223 0.0117188C37.2676 0.0117188 37.9375 0.263672 38.332 0.767578C38.7305 1.27148 38.9297 2.03711 38.9297 3.06445H36.832V2.35547C36.832 2.21484 36.791 2.10547 36.709 2.02734C36.6309 1.94922 36.5234 1.91016 36.3867 1.91016C36.2227 1.91016 36.1016 1.95703 36.0234 2.05078C35.9492 2.14062 35.9121 2.25781 35.9121 2.40234C35.9121 2.54688 35.9512 2.70312 36.0293 2.87109C36.1074 3.03906 36.2617 3.23242 36.4922 3.45117L37.6816 4.59375C37.9199 4.82031 38.1387 5.06055 38.3379 5.31445C38.5371 5.56445 38.6973 5.85742 38.8184 6.19336C38.9395 6.52539 39 6.93164 39 7.41211C39 8.38086 38.8203 9.14062 38.4609 9.69141C38.1055 10.2383 37.4844 10.5117 36.5977 10.5117Z" fill="white" />
        </svg>

        {/* Content Panel Box */}
        <div className="mt-6 sm:mt-12 pt-7 bg-[#4565bc] rounded-4xl">
          <div className="flex flex-col sm:flex-row sm:items-stretch justify-between sm:bg-[#4565bc] rounded-b-4xl relative z-10 px-3 sm:px-6 pb-6">
            <div className="flex flex-col justify-between">
              <h2 className="text-[#F1BF0A] text-5xl font-anton uppercase tracking-widest">PREMIUM</h2>
              <p className="mt-2 mb-6 sm:mb-0 sm:mt-0 sm:max-w-xs z-[200]">
                Engineered for everyday adventures. Durable, lightweight, and built to move with you wherever the journey leads.
              </p>
            </div>
            <div className="bg-[#abb9de] rounded-2xl p-4 text-[#090909] sm:max-w-[185px]">
              <div className="flex items-center gap-4 sm:gap-0 sm:flex-col sm:items-start">
                <span className="text-4xl font-anton">98%</span>
                <div className="-space-x-3 my-4">
                  <img src="https://i.postimg.cc/y8g3KSxd/avatar-1.jpg" alt="" className="inline-block size-10 rounded-full outline -outline-offset-1 outline-black/5" />
                  <img src="https://i.postimg.cc/BnrLnQPp/avatar-2.jpg" alt="" className="inline-block size-10 rounded-full outline -outline-offset-1 outline-black/5" />
                  <img src="https://i.postimg.cc/W1BF1bqQ/avatar-3.jpg" alt="" className="inline-block size-10 rounded-full outline -outline-offset-1 outline-black/5" />
                </div>
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-800 leading-snug">Customer satisfaction rating across all orders</p>
            </div>
          </div>

          <div className="flex items-stretch justify-between relative z-[5] after:content-[''] after:absolute after:-top-1/2 after:left-0 after:h-20 after:w-24 after:bg-[#183fad] after:-z-[5] before:content-[''] before:absolute before:-top-1/2 before:right-0 before:h-20 before:w-24 before:bg-[#183fad] before:-z-[5] after:hidden sm:after:block before:hidden sm:before:block">
            <div className="sm:bg-[#183fad] pb-3 pl-3 sm:p-6 rounded-tr-4xl rounded-bl-4xl relative after:content-[''] after:absolute after:bottom-0 after:-right-1/2 after:h-1/2 after:w-full after:bg-[#183fad] after:-z-[5] after:hidden sm:after:block">
              {/* Interactive Shop Now CTA */}
              <button 
                onClick={() => setActiveView('overview')}
                className="flex items-center gap-2 bg-[#F1BF0A] rounded-full py-1.5 pl-1.5 pr-4 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.5 after:rounded-full after:bg-white after:h-9 after:w-9 hover:after:w-full after:transition-[width] after:duration-[1600ms] after:ease-[linear(0,0.029_0.8%,0.13_1.8%,0.908_7.2%,1.051_9.1%,1.112_11.2%,1.116_12.2%,1.106_13.4%,1.007_19.5%,0.987_23.1%,1.001_35%,1)] overflow-hidden hover:after:h-full hover:after:left-0 cursor-pointer border border-[#F1BF0A]"
              >
                <div className="rounded-full p-1.5 relative z-10 bg-white/10 text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                  </svg>
                </div>
                <span className="relative z-10 font-bold text-sm">Shop Now</span>
              </button>
            </div>
            
            <div className="hidden sm:block bg-[#4565bc] flex-1 rounded-b-4xl relative z-10"></div>
            
            <div className="hidden sm:flex items-center gap-3 bg-[#183fad] p-6 rounded-tl-4xl rounded-br-4xl relative after:content-[''] after:absolute after:bottom-0 after:-left-1/2 after:h-1/2 after:w-full after:bg-[#183fad] after:-z-[5]">
              <button 
                type="button" 
                onClick={() => setActiveView('overview')}
                className="flex items-center bg-[#F1BF0A] rounded-full p-1.5 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.5 after:rounded-full after:bg-white after:h-9 after:w-9 after:transition-[width,left] after:duration-[2000ms] after:ease-[linear(0,0.014_0.4%,0.054_0.8%,0.228_1.7%,1.141_4.6%,1.402_5.6%,1.565_6.6%,1.599_7%,1.617_7.5%,1.611_7.9%,1.58_8.4%,1.47_9.3%,0.924_12.1%,0.747_13.2%,0.655_14.1%,0.633_14.5%,0.62_15%,0.622_15.4%,0.639_15.9%,0.705_16.8%,1.052_19.7%,1.159_20.8%,1.214_21.7%,1.235_22.6%,1.221_23.5%,1.18_24.4%,0.972_27.2%,0.905_28.3%,0.869_29.2%,0.855_30.1%,0.862_31%,0.887_31.9%,1.06_35.9%,1.081_36.8%,1.089_37.7%,1.084_38.6%,1.069_39.5%,0.964_43.4%,0.945_45.2%,0.954_46.8%,1.019_50.7%,1.034_52.7%,1.029_54.3%,0.989_58.2%,0.979_60.3%,1.013_67.8%,0.992_75.3%,1.005_82.7%,0.997_90.4%,1)] overflow-hidden hover:after:size-full hover:after:left-0 cursor-pointer border border-[#F1BF0A]"
              >
                <span className="rounded-full p-1.5 relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
                  </svg>
                </span>
              </button>
              <button 
                type="button" 
                onClick={() => setActiveView('overview')}
                className="flex items-center bg-[#F1BF0A] rounded-full p-1.5 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.5 after:rounded-full after:bg-white after:h-9 after:w-9 after:transition-[width,left] after:duration-[2000ms] after:ease-[linear(0,0.014_0.4%,0.054_0.8%,0.228_1.7%,1.141_4.6%,1.402_5.6%,1.565_6.6%,1.599_7%,1.617_7.5%,1.611_7.9%,1.58_8.4%,1.47_9.3%,0.924_12.1%,0.747_13.2%,0.655_14.1%,0.633_14.5%,0.62_15%,0.622_15.4%,0.639_15.9%,0.705_16.8%,1.052_19.7%,1.159_20.8%,1.214_21.7%,1.235_22.6%,1.221_23.5%,1.18_24.4%,0.972_27.2%,0.905_28.3%,0.869_29.2%,0.855_30.1%,0.862_31%,0.887_31.9%,1.06_35.9%,1.081_36.8%,1.089_37.7%,1.084_38.6%,1.069_39.5%,0.964_43.4%,0.945_45.2%,0.954_46.8%,1.019_50.7%,1.034_52.7%,1.029_54.3%,0.989_58.2%,0.979_60.3%,1.013_67.8%,0.992_75.3%,1.005_82.7%,0.997_90.4%,1)] overflow-hidden hover:after:size-full hover:after:left-0 cursor-pointer border border-[#F1BF0A]"
              >
                <span className="rounded-full p-1.5 relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Big graphic mug image exact reference */}
        <img 
          src="https://i.postimg.cc/YqVLr48H/mug.png" 
          alt="Big mug" 
          role="presentation" 
          className="hidden md:block object-contain h-[55vw] max-h-[560px] absolute bottom-6 left-[53%] -translate-x-1/2 z-[100] select-none pointer-events-none" 
          draggable="false" 
          style={{ filter: "drop-shadow(5px 5px 10px rgba(0, 0, 0, 0.5))" }} 
        />
      </header>

      {/* 3. Explore Collection Content */}
      <main className="max-w-5xl mx-auto mt-20 overflow-hidden sm:px-9.5">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10">
          <h1 className="font-anton text-5xl/14 md:text-6xl/18 flex-1 uppercase tracking-wider text-black">
            EXPLORE THE <br className="hidden md:inline" />COLLECTION
          </h1>
          <div className="flex-1 space-y-4">
            <p className="text-slate-600 text-sm font-medium">Limited edition mugs designed for everyday carry and modern travel. Only 2,000 units worldwide.</p>

            <button 
              onClick={() => setActiveView('overview')}
              className="inline-flex items-center gap-2 bg-[#F1BF0A] rounded-full py-1.25 pl-1.25 pr-3.5 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.5 after:rounded-full after:bg-white after:h-9 after:w-9 hover:after:w-full after:transition-[width,color] after:duration-[1600ms] after:ease-[linear(0,0.029_0.8%,0.13_1.8%,0.908_7.2%,1.051_9.1%,1.112_11.2%,1.116_12.2%,1.106_13.4%,1.007_19.5%,0.987_23.1%,1.001_35%,1)] overflow-hidden hover:after:h-full hover:after:left-0 border border-[#F1BF0A] cursor-pointer"
            >
              <div className="rounded-full p-1.5 relative z-10 bg-white/10 text-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                </svg>
              </div>
              <span className="relative z-10 font-bold text-sm">Explore Collection</span>
            </button>
          </div>
        </div>

        {/* Dynamic Card List exact reference */}
        <ul role="list" className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 md:grid-cols-3 mt-10">
          {products.map((product, idx) => (
            <li key={idx} className="col-span-1 flex flex-col rounded-3xl overflow-hidden border border-black/5 shadow-md">
              <div>
                <div className="flex">
                  <div className="pl-3 flex-1 bg-[#e9ecf6] flex gap-2 items-center rounded-tr-2xl relative after:content-[''] after:absolute after:top-0 after:right-0 after:h-1/2 after:w-1/2 after:bg-white after:-z-[5]">
                    <span className="line-through text-[#b7bac5] font-medium text-xs">${product.originalPrice}</span>
                    <span className="font-semibold text-[#090909] text-sm">${product.price}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white pl-1.5 pr-px pt-1 pb-1.5 rounded-bl-3xl rounded-tr-3xl relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1/2 after:w-1/2 after:bg-[#e9ecf6] after:-z-[5]">
                    <button 
                      onClick={() => setActiveView('overview')}
                      type="button" 
                      className="flex items-center bg-[#F1BF0A] rounded-full p-1.25 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.25 after:rounded-full after:bg-white after:w-8 after:h-8 sm:after:h-5.5 sm:after:w-5.5 after:transition-[width,left] after:duration-[2000ms] after:ease-[linear(0,0.014_0.4%,0.054_0.8%,0.228_1.7%,1.141_4.6%,1.402_5.6%,1.565_6.6%,1.599_7%,1.617_7.5%,1.611_7.9%,1.58_8.4%,1.47_9.3%,0.924_12.1%,0.747_13.2%,0.655_14.1%,0.633_14.5%,0.62_15%,0.622_15.4%,0.639_15.9%,0.705_16.8%,1.052_19.7%,1.159_20.8%,1.214_21.7%,1.235_22.6%,1.221_23.5%,1.18_24.4%,0.972_27.2%,0.905_28.3%,0.869_29.2%,0.855_30.1%,0.862_31%,0.887_31.9%,1.06_35.9%,1.081_36.8%,1.089_37.7%,1.084_38.6%,1.069_39.5%,0.964_43.4%,0.945_45.2%,0.954_46.8%,1.019_50.7%,1.034_52.7%,1.029_54.3%,0.989_58.2%,0.979_60.3%,1.013_67.8%,0.992_75.3%,1.005_82.7%,0.997_90.4%,1)] overflow-hidden hover:after:size-full hover:after:left-0 cursor-pointer border border-[#F1BF0A]"
                    >
                      <span className="rounded-full p-1.5 sm:p-1 relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 sm:size-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                      </span>
                    </button>
                    <button 
                      onClick={() => setActiveView('chat')}
                      type="button" 
                      className="flex items-center bg-[#F1BF0A] rounded-full p-1.25 text-[#090909] whitespace-nowrap relative after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1.25 after:rounded-full after:bg-white after:w-8 after:h-8 sm:after:h-5.5 sm:after:w-5.5 after:transition-[width,left] after:duration-2000 after:ease-[linear(0,0.014_0.4%,0.054_0.8%,0.228_1.7%,1.141_4.6%,1.402_5.6%,1.565_6.6%,1.599_7%,1.617_7.5%,1.611_7.9%,1.58_8.4%,1.47_9.3%,0.924_12.1%,0.747_13.2%,0.655_14.1%,0.633_14.5%,0.62_15%,0.622_15.4%,0.639_15.9%,0.705_16.8%,1.052_19.7%,1.159_20.8%,1.214_21.7%,1.235_22.6%,1.221_23.5%,1.18_24.4%,0.972_27.2%,0.905_28.3%,0.869_29.2%,0.855_30.1%,0.862_31%,0.887_31.9%,1.06_35.9%,1.081_36.8%,1.089_37.7%,1.084_38.6%,1.069_39.5%,0.964_43.4%,0.945_45.2%,0.954_46.8%,1.019_50.7%,1.034_52.7%,1.029_54.3%,0.989_58.2%,0.979_60.3%,1.013_67.8%,0.992_75.3%,1.005_82.7%,0.997_90.4%,1)] overflow-hidden hover:after:size-full hover:after:left-0 cursor-pointer border border-[#F1BF0A]"
                    >
                      <span className="rounded-full p-1.5 sm:p-1 relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 sm:size-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                      </span>
                    </button>
                  </div>
                </div>
                <h3 className="pl-3 text-sm py-2 truncate bg-[#e9ecf6] rounded-tr-3xl font-semibold text-[#090909]">{product.name}</h3>
              </div>
              <div className="flex flex-1 flex-col px-2 pb-2 bg-[#e9ecf6]">
                <img src={product.image} alt={product.name} className="select-none pointer-events-none w-full shrink-0 rounded-2xl object-cover h-64 border border-black/5" />
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* 4. Neoclassic Footer */}
      <footer className="max-w-5xl mx-auto bg-[#183fad] text-white px-4 sm:px-9.5 pb-4 mt-20 pt-6 sm:pt-10 rounded-t-4xl relative z-0 overflow-hidden">
        <nav className="-mb-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm/6 font-semibold">
          <button onClick={() => setActiveView('landing')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none">Home</button>
          <button onClick={() => setActiveView('overview')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none">Dashboard</button>
          <button onClick={() => setActiveView('chat')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none">Company</button>
          <button onClick={() => setActiveView('api-key')} className="hover:text-[#F1BF0A] transition-colors cursor-pointer bg-transparent border-none">Stores</button>
        </nav>

        <div className="mt-10 border-t border-white/30 pt-4 md:flex md:items-center md:justify-between">
          <div className="flex gap-x-6 justify-center md:justify-start md:order-2">
            <a href="#" className="text-white hover:text-[#F1BF0A] transition-colors">
              <span className="sr-only">Facebook</span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" fill-rule="evenodd"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-[#F1BF0A] transition-colors">
              <span className="sr-only">Instagram</span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" fill-rule="evenodd"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-[#F1BF0A] transition-colors">
              <span className="sr-only">X</span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-[#F1BF0A] transition-colors">
              <span className="sr-only">GitHub</span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" fill-rule="evenodd"></path>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-[#F1BF0A] transition-colors">
              <span className="sr-only">YouTube</span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                <path d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clip-rule="evenodd" fill-rule="evenodd"></path>
              </svg>
            </a>
          </div>
          <p className="mt-4 sm:mt-8 text-sm/6 text-white/50 text-center md:text-left md:order-1 md:mt-0">© 2026 Mugsy's Mugs, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
