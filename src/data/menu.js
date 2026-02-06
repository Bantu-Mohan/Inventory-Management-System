export const menu = {
    categories: [
        { id: 'milk-tea', name: 'Milk Tea' },
        { id: 'coffee', name: 'Coffee' },
        { id: 'special-tea', name: 'Special Tea' },
        { id: 'milk-items', name: 'Milk Items' },
        { id: 'snacks', name: 'Snacks' }
    ],
    items: [
        // Milk Tea - Using chai/tea images
        { id: 'chai-villa', name: 'Chai Villa Chai', description: 'Our signature chai blend', price: 10, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&h=200&fit=crop' },
        { id: 'matka-chai', name: 'Matka Cup Chai', description: 'Traditional clay pot chai', price: 15, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=200&h=200&fit=crop' },
        { id: 'elachi-chai', name: 'Elachi Chai', description: 'Cardamom flavored tea', price: 15, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=200&h=200&fit=crop' },
        { id: 'masala-tea', name: 'Masala Tea', description: 'Spiced Indian tea', price: 15, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=200&h=200&fit=crop' },
        { id: 'ginger-tea', name: 'Ginger Tea', description: 'Fresh ginger infused tea', price: 15, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop' },
        { id: 'badam-tea', name: 'Badam Tea', description: 'Almond flavored tea', price: 15, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=200&h=200&fit=crop' },
        { id: 'tea-parcel', name: 'Tea Parcel', description: 'Take-away chai pack', price: 15, category: 'milk-tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop' },

        // Coffee
        { id: 'coffee', name: 'Coffee', description: 'Freshly brewed coffee', price: 15, category: 'coffee', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop' },
        { id: 'black-coffee', name: 'Black Coffee', description: 'Strong black coffee', price: 15, category: 'coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop' },
        { id: 'dark-chocolate', name: 'Dark Chocolate', description: 'Rich dark chocolate drink', price: 15, category: 'coffee', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=200&h=200&fit=crop' },
        { id: 'horlicks', name: 'Horlicks', description: 'Malted milk drink', price: 15, category: 'coffee', image: 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=200&h=200&fit=crop' },
        { id: 'coffee-parcel', name: 'Coffee Parcel', description: 'Take-away coffee pack', price: 20, category: 'coffee', image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=200&h=200&fit=crop' },

        // Special Tea
        { id: 'black-tea', name: 'Black Tea', description: 'Light and refreshing', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&h=200&fit=crop' },
        { id: 'lemon-tea', name: 'Lemon Tea', description: 'Tangy lemon infused', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop' },
        { id: 'ginger-lemon-tea', name: 'Ginger Lemon Tea', description: 'Ginger with lemon twist', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=200&h=200&fit=crop' },
        { id: 'green-tea', name: 'Green Tea', description: 'Healthy green tea', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=200&h=200&fit=crop' },
        { id: 'pink-guava-lemon', name: 'Pink Guava Lemon Tea', description: 'Fruity guava blend', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=200&h=200&fit=crop' },
        { id: 'mango-lemon', name: 'Mango Lemon Tea', description: 'Sweet mango flavor', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=200&h=200&fit=crop' },
        { id: 'pina-colada-lemon', name: 'Pina Colada Lemon Tea', description: 'Tropical pineapple coconut', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=200&fit=crop' },
        { id: 'grenadine-lemon', name: 'Grenadine Lemon Tea', description: 'Sweet pomegranate flavor', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=200&h=200&fit=crop' },
        { id: 'blueberry-lemon', name: 'Blueberry Lemon Tea', description: 'Berry infused delight', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&h=200&fit=crop' },
        { id: 'green-apple-lemon', name: 'Green Apple Lemon Tea', description: 'Crisp apple freshness', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop' },
        { id: 'blue-curacao-lemon', name: 'Blue Curacao Lemon Tea', description: 'Exotic citrus blend', price: 15, category: 'special-tea', image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=200&h=200&fit=crop' },

        // Milk Items
        { id: 'masala-milk', name: 'Masala Milk', description: 'Spiced warm milk', price: 15, category: 'milk-items', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop' },
        { id: 'ragi-malt', name: 'Ragi Malt Drink Mix', description: 'Nutritious finger millet drink', price: 15, category: 'milk-items', image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=200&h=200&fit=crop' },
        { id: 'rose-drink', name: 'Rose Drink Mix', description: 'Fragrant rose milk', price: 15, category: 'milk-items', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=200&h=200&fit=crop' },
        { id: 'chocolate-drink', name: 'Chocolate Drink', description: 'Rich chocolate milk', price: 15, category: 'milk-items', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop' },
        { id: 'badam-drink', name: 'Badam Drink Mix', description: 'Almond milk drink', price: 15, category: 'milk-items', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&h=200&fit=crop' },
        { id: 'pista-badam', name: 'Pista Badam Drink Mix', description: 'Pistachio almond blend', price: 15, category: 'milk-items', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=200&h=200&fit=crop' },

        // Snacks
        { id: 'biscuit', name: 'Biscuit (4 pcs)', description: 'Crispy tea-time biscuits', price: 10, category: 'snacks', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop' },
        { id: 'onion-samosa', name: 'Onion Samosa (6 pcs)', description: 'Crunchy onion filled', price: 20, category: 'snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop' },
        { id: 'alu-samosa', name: 'Alu Samosa (1 pc)', description: 'Classic potato samosa', price: 15, category: 'snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop' },
        { id: 'sweetcorn-samosa', name: 'Sweet Corn Samosa (5 pcs)', description: 'Sweet corn filling', price: 20, category: 'snacks', image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&h=200&fit=crop' },
        { id: 'egg-samosa', name: 'Egg Samosa (4 pcs)', description: 'Egg masala filling', price: 20, category: 'snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop' },
        { id: 'chicken-samosa', name: 'Chicken Samosa (3 pcs)', description: 'Spicy chicken filling', price: 20, category: 'snacks', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&h=200&fit=crop' }
    ]
};
