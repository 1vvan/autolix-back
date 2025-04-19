function calculateYearModifier(carYear) {
    const currentYear = new Date().getFullYear();
    const diff = currentYear - carYear;

    if (diff <= 3) return 0;
    if (diff <= 10) return 100;
    return 200;
}

module.exports = { calculateYearModifier };