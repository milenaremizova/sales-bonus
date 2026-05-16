/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const { discount = 1 - (purchase.discount / 100), sale_price, quantity } = purchase;
    return sale_price * quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.01;
    } else if (index === total - 1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data.purchase_records 
        || !Array.isArray(data.purchase_records)) {
        throw new error('Некорректные входные данные')
    };
    // @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {
        throw new Error('Что-то не так');
    }

    const { calculateRevenue, calculateBonus } = options;
    if (
        !calculateRevenue ||
        !calculateBonus ||
        typeof calculateRevenue !== 'function' ||
        typeof calculateBonus !== 'function'
    ) {
        throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        // Заполним начальными данными
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.id, seller])
    );
    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;

        let totalAmount = 0;
        record.items.forEach(items => {
            totalAmount += items.quantity * items.sale_price;
        });
        seller.revenue += totalAmount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * product.quantity;
            revenue = calculateSimpleRevenue(item, product);

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            } seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    const sellerStatsSorted = sellerStats.sort((left, right) => right.profit - left.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStatsSorted.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStatsSorted.length, seller);// Считаем бонус
    // Формируем топ-10 товаров
        seller.top_products =
            Object.entries(seller.products_sold)
                .map(([sku, quantity]) => ({
                    sku,
                    quantity
                }))
                .sort((left, right) => right.quantity - left.quantity)
                .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: `${seller.id}`,
        name: `${seller.name}`,
        revenue: +seller.revenue.toFixed(2), 
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: sellerStatsSorted,
        bonus: +seller.bonus.toFixed(2)
    }));
}
