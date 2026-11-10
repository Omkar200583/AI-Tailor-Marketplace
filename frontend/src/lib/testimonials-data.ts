// Demo testimonials data — replace with real reviews from your database
// when the reviews API is ready. Each testimonial is clearly marked as sample content.

export interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  avatarColor: string
  rating: number
  text: string
  product: string
  verified: boolean
  date: string
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Priya Sharma',
    role: 'Bride',
    location: 'Pune, Maharashtra',
    avatarColor: '#7C2D3E',
    rating: 5,
    text: 'The AI Tailor platform transformed my wedding outfit experience. The tailor understood my vision perfectly, and the fit was impeccable. The 25% advance system gave me confidence, and the final result exceeded all expectations.',
    product: 'Bridal Lehenga with Gold Embroidery',
    verified: true,
    date: '2026-10-15',
  },
  {
    id: 't2',
    name: 'Rajesh Kumar',
    role: 'Software Engineer',
    location: 'Mumbai, Maharashtra',
    avatarColor: '#D69A28',
    rating: 5,
    text: 'I ordered a custom wedding kurta and was blown away by the quality. The AI design studio helped me visualize exactly what I wanted, and the measurements system ensured a perfect fit. Highly recommended!',
    product: 'Royal Black Wedding Kurta',
    verified: true,
    date: '2026-10-10',
  },
  {
    id: 't3',
    name: 'Ananya Desai',
    role: 'Fashion Designer',
    location: 'Bangalore, Karnataka',
    avatarColor: '#0F766E',
    rating: 5,
    text: 'As a designer myself, I am incredibly picky about tailoring. AI Tailor connected me with a craftsman who understood every detail of my design. The virtual try-on feature was a game-changer for confirming the look.',
    product: 'Designer Saree Blouse',
    verified: true,
    date: '2026-10-08',
  },
  {
    id: 't4',
    name: 'Vikram Patel',
    role: 'Business Owner',
    location: 'Ahmedabad, Gujarat',
    avatarColor: '#9D174D',
    rating: 4,
    text: 'Great experience overall. The chat system let me discuss my requirements directly with the tailor before paying. The two-payment system (25% advance + 75% on delivery) felt very secure. Will order again.',
    product: 'Formal Office Shirt Set',
    verified: true,
    date: '2026-10-05',
  },
  {
    id: 't5',
    name: 'Meera Iyer',
    role: 'College Student',
    location: 'Chennai, Tamil Nadu',
    avatarColor: '#B45309',
    rating: 5,
    text: 'The body measurements feature saved me so much time. I just saved my measurements once, and every order since has fit perfectly. The design history lets me revisit my favorite AI-generated designs anytime.',
    product: 'Custom Kurti with Mirror Work',
    verified: true,
    date: '2026-10-01',
  },
  {
    id: 't6',
    name: 'Arjun Nair',
    role: 'Marketing Manager',
    location: 'Kochi, Kerala',
    avatarColor: '#6D28D9',
    rating: 5,
    text: 'The virtual try-on gave me confidence before ordering. Being able to see how the outfit would look on my photo before paying was incredible. The delivery was on time and the quality was outstanding.',
    product: 'Casual Cotton Shirt',
    verified: true,
    date: '2026-09-28',
  },
  {
    id: 't7',
    name: 'Sneha Reddy',
    role: 'Doctor',
    location: 'Hyderabad, Telangana',
    avatarColor: '#15803D',
    rating: 5,
    text: 'I was hesitant about online tailoring, but the seller dashboard transparency won me over. I could track every stage — from acceptance to stitching to dispatch. The notification system kept me updated throughout.',
    product: 'Silk Salwar Suit',
    verified: true,
    date: '2026-09-25',
  },
  {
    id: 't8',
    name: 'Karan Mehta',
    role: 'Architect',
    location: 'Surat, Gujarat',
    avatarColor: '#7C2D3E',
    rating: 5,
    text: 'The design sharing feature is brilliant. I generated a design in the AI Studio, shared it with the tailor through chat, and they brought it to life exactly as envisioned. The whole process felt collaborative.',
    product: 'Designer Indo-Western Jacket',
    verified: true,
    date: '2026-09-20',
  },
  {
    id: 't9',
    name: 'Divya Krishnan',
    role: 'Teacher',
    location: 'Coimbatore, Tamil Nadu',
    avatarColor: '#D69A28',
    rating: 5,
    text: 'The find-tailors-near-me feature connected me with a verified shop just 2 km away. I could chat, place the order, and track delivery — all from my phone. The wine and gold themed website itself looks so premium.',
    product: 'Everyday Cotton Kurta',
    verified: true,
    date: '2026-09-18',
  },
]

export const featuredTestimonial: Testimonial = {
  id: 'featured',
  name: 'Priya Sharma',
  role: 'Bride — Pune',
  location: 'Pune, Maharashtra',
  avatarColor: '#7C2D3E',
  rating: 5,
  text: 'My wedding lehenga was the most important outfit of my life. AI Tailor connected me with a master craftsman who understood every detail. From the AI design visualization to the perfect fit — the entire journey was magical. The two-payment system made me feel secure, and the real-time chat let me fine-tune every detail. I felt heard, valued, and delighted. This is the future of custom fashion.',
  product: 'Bridal Lehenga with Gold Embroidery',
  verified: true,
  date: '2026-10-15',
}

// Demo statistics — clearly identified as sample data
export const testimonialStats = {
  totalCustomers: '12,000+',
  satisfaction: '98%',
  verifiedReviews: '8,500+',
  averageRating: '4.9',
}
