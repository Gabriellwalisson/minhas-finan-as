// ===== Formatação =====

export const fmtBRL = (value) =>
  value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export const fmtDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export const CATEGORIES = {
  income:     ['Salário', 'Acerto', 'Rendimento', 'Freelance', 'Outros'],
  expense:    ['Click', 'MP', 'Digio', 'Inter', 'Neon', 'Ponto', 'Contas Fixas', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'],
  investment: ['Reserva de Emergência', 'Ações', 'Fundos', 'CDB/Tesouro', 'Cripto', 'Outros'],
}

export const TYPE_COLORS = {
  income:     { text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  expense:    { text: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20',       border: 'border-rose-200 dark:border-rose-800'    },
  investment: { text: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-200 dark:border-blue-800'    },
}

// ===== Gerador de setup inicial (salário) =====

export function generateInitialTransactions() {
  const generated = []
  const baseDate = new Date()
  let current = new Date(baseDate.getFullYear(), baseDate.getMonth(), 5)
  const limitSalario = new Date(2028, 0, 5)
  const limitAcerto  = new Date(2027, 1, 5)

  while (current <= limitSalario) {
    const formatted = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-05`

    generated.push({
      description: 'Salário', amount: 4500,
      type: 'income', date: formatted, category: 'Salário'
    })

    if (current <= limitAcerto) {
      generated.push({
        description: 'Acerto', amount: 900,
        type: 'income', date: formatted, category: 'Acerto'
      })
    }

    current.setMonth(current.getMonth() + 1)
  }

  return generated
}

// ===== Exportar PDF =====

export async function exportPDF({ transactions, month, year, income, expense, invest, balance }) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Minhas Finanças', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório de ${monthNames[month]} / ${year}`, 14, 24)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 31)

  // Resumo
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo do Mês', 14, 50)

  const summaryData = [
    ['Entradas', fmtBRL(income), ''],
    ['Gastos',   fmtBRL(expense), ''],
    ['Investido',fmtBRL(invest),  ''],
    ['Saldo',    fmtBRL(balance), balance >= 0 ? 'Positivo ✓' : 'Negativo ✗'],
  ]

  autoTable(doc, {
    startY: 54,
    head: [['Categoria', 'Valor', 'Status']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Transações
  const startY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Transações', 14, startY)

  const rows = transactions.map(t => [
    fmtDate(t.date),
    t.description,
    t.category,
    t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Gasto' : 'Investimento',
    fmtBRL(t.amount),
  ])

  autoTable(doc, {
    startY: startY + 4,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = data.cell.raw
        if (v === 'Entrada') data.cell.styles.textColor = [16, 185, 129]
        else if (v === 'Gasto') data.cell.styles.textColor = [244, 63, 94]
        else data.cell.styles.textColor = [59, 130, 246]
      }
    }
  })

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${i} de ${pageCount}`, pageW - 14, 290, { align: 'right' })
  }

  doc.save(`financas-${monthNames[month].toLowerCase()}-${year}.pdf`)
}
