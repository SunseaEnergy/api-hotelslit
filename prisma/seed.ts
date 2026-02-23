// import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── CATEGORIES ──────────────────────────────────────────
  const categories = await Promise.all(
    [
      { name: 'City', image: 'https://res.cloudinary.com/da5ludds5/image/upload/v1771844294/city_lurgxu.jpg' },
      {
        name: 'Resort',
        image: 'https://res.cloudinary.com/da5ludds5/image/upload/v1771844301/resort_ffyw5q.avif',
      },
      {
        name: 'Beach',
        image: 'https://res.cloudinary.com/da5ludds5/image/upload/v1771843792/beach_qaux38.jpg',
      },
      {
        name: 'Mountain',
        image: 'https://res.cloudinary.com/da5ludds5/image/upload/v1771844302/mountain_cjukdo.jpg',
      },
      {
        name: 'Luxury',
        image: 'https://res.cloudinary.com/da5ludds5/image/upload/v1771844285/luxury_vjyhro.jpg',
      },
    ].map((cat) =>
      prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      }),
    ),
  );
  console.log(`✅ Seeded ${categories.length} categories`);

  // ─── AMENITY CATEGORIES & ITEMS ──────────────────────────
  // const amenityData = [
  //   {
  //     title: 'General',
  //     icon: 'home-outline',
  //     order: 1,
  //     items: [
  //       { name: 'WiFi', icon: 'wifi-outline' },
  //       { name: 'Parking', icon: 'car-outline' },
  //       { name: 'Air Conditioning', icon: 'snow-outline' },
  //       { name: 'Heating', icon: 'flame-outline' },
  //       { name: 'Elevator', icon: 'arrow-up-outline' },
  //       { name: 'Reception 24/7', icon: 'time-outline' },
  //     ],
  //   },
  //   {
  //     title: 'Room Features',
  //     icon: 'bed-outline',
  //     order: 2,
  //     items: [
  //       { name: 'TV', icon: 'tv-outline' },
  //       { name: 'Mini Bar', icon: 'wine-outline' },
  //       { name: 'Safe', icon: 'lock-closed-outline' },
  //       { name: 'Balcony', icon: 'sunny-outline' },
  //       { name: 'Work Desk', icon: 'desktop-outline' },
  //       { name: 'Iron & Board', icon: 'shirt-outline' },
  //     ],
  //   },
  //   {
  //     title: 'Bathroom',
  //     icon: 'water-outline',
  //     order: 3,
  //     items: [
  //       { name: 'Bathtub', icon: 'water-outline' },
  //       { name: 'Shower', icon: 'rainy-outline' },
  //       { name: 'Hair Dryer', icon: 'flash-outline' },
  //       { name: 'Toiletries', icon: 'bag-outline' },
  //     ],
  //   },
  //   {
  //     title: 'Recreation',
  //     icon: 'fitness-outline',
  //     order: 4,
  //     items: [
  //       { name: 'Swimming Pool', icon: 'water-outline' },
  //       { name: 'Gym', icon: 'fitness-outline' },
  //       { name: 'Spa', icon: 'leaf-outline' },
  //       { name: 'Game Room', icon: 'game-controller-outline' },
  //       { name: 'Garden', icon: 'flower-outline' },
  //     ],
  //   },
  //   {
  //     title: 'Dining',
  //     icon: 'restaurant-outline',
  //     order: 5,
  //     items: [
  //       { name: 'Restaurant', icon: 'restaurant-outline' },
  //       { name: 'Bar', icon: 'beer-outline' },
  //       { name: 'Room Service', icon: 'cart-outline' },
  //       { name: 'Breakfast Included', icon: 'cafe-outline' },
  //       { name: 'Kitchen', icon: 'flame-outline' },
  //     ],
  //   },
  //   {
  //     title: 'Services',
  //     icon: 'people-outline',
  //     order: 6,
  //     items: [
  //       { name: 'Laundry', icon: 'shirt-outline' },
  //       { name: 'Concierge', icon: 'person-outline' },
  //       { name: 'Shuttle Service', icon: 'bus-outline' },
  //       { name: 'Tour Desk', icon: 'map-outline' },
  //       { name: 'Luggage Storage', icon: 'briefcase-outline' },
  //     ],
  //   },
  // ];

  // let totalAmenityItems = 0;
  // for (const category of amenityData) {
  //   const amenityCategory = await prisma.amenityCategory.create({
  //     data: {
  //       title: category.title,
  //       icon: category.icon,
  //       order: category.order,
  //     },
  //   });

  //   for (const item of category.items) {
  //     await prisma.amenityItem.create({
  //       data: {
  //         categoryId: amenityCategory.id,
  //         name: item.name,
  //         icon: item.icon,
  //       },
  //     });
  //     totalAmenityItems++;
  //   }
  // }
  // console.log(
  //   `✅ Seeded ${amenityData.length} amenity categories with ${totalAmenityItems} items`,
  // );

  // // ─── PROMO CODES ─────────────────────────────────────────
  // const promoCodes = await Promise.all([
  //   prisma.promoCode.create({
  //     data: {
  //       code: 'WELCOME10',
  //       discountPercent: 10,
  //       maxUses: 1000,
  //       expiresAt: new Date('2026-12-31'),
  //       isActive: true,
  //     },
  //   }),
  //   prisma.promoCode.create({
  //     data: {
  //       code: 'HOTELSLIT20',
  //       discountPercent: 20,
  //       maxUses: 500,
  //       expiresAt: new Date('2026-06-30'),
  //       isActive: true,
  //     },
  //   }),
  //   prisma.promoCode.create({
  //     data: {
  //       code: 'FLAT5000',
  //       discountAmount: 5000,
  //       maxUses: 200,
  //       expiresAt: new Date('2026-03-31'),
  //       isActive: true,
  //     },
  //   }),
  //   prisma.promoCode.create({
  //     data: {
  //       code: 'SUMMER15',
  //       discountPercent: 15,
  //       maxUses: 300,
  //       expiresAt: new Date('2026-09-30'),
  //       isActive: true,
  //     },
  //   }),
  // ]);
  // console.log(`✅ Seeded ${promoCodes.length} promo codes`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
