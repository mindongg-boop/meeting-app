const departmentColors = [
    'bg-sky-200 text-sky-800 border-sky-500',
    'bg-amber-200 text-amber-800 border-amber-500',
    'bg-violet-200 text-violet-800 border-violet-500',
    'bg-emerald-200 text-emerald-800 border-emerald-500',
    'bg-rose-200 text-rose-800 border-rose-500',
    'bg-indigo-200 text-indigo-800 border-indigo-500',
    'bg-fuchsia-200 text-fuchsia-800 border-fuchsia-500',
    'bg-teal-200 text-teal-800 border-teal-500',
];

const colorMap = new Map<string, { bg: string, text: string, border: string }>();
let nextColorIndex = 0;

export const getDepartmentColorClasses = (department: string): { bg: string, text: string, border: string } => {
    if (!colorMap.has(department)) {
        const [bg, text, border] = departmentColors[nextColorIndex].split(' ');
        colorMap.set(department, { bg, text, border });
        nextColorIndex = (nextColorIndex + 1) % departmentColors.length;
    }
    return colorMap.get(department)!;
};
