import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

CustomEase.create('cinematic', 'M0,0 C0.08,0.56 0.12,0.86 0.3,0.94 0.5,1.02 0.58,1 1,1');
CustomEase.create('filmOut', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create('snapIn', 'M0,0 C0.2,0.8 0.2,1 1,1');

gsap.defaults({
  ease: 'cinematic',
  force3D: true,
});

export { gsap, ScrollTrigger, CustomEase, useGSAP };
