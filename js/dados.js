const DATA = {
  "condicoes": {
    "Enxaqueca": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Metoclopramida 10 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se náuseas ou vômitos",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Sumatriptano 25mg",
          "qtde": "01 Caixa",
          "posologia": "Se dor, apesar das medicações acima, utilizar 01 comprimido, no máximo de 04 comprimidos ao dia.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Naproxeno 500 mg",
          "qtde": "01 Caixa",
          "posologia": null,
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Em caso de sintomas compatíveis como: \nPior dor de cabeça da vida; Uma dor completamente diferente; Mudança na Consciência; Fraqueza Repentina; Problemas da Fala; Visão Dupla ou Perda súbita da visão; Convulsões; Febre alta inexplicável (acima de 39°); Dor que piora ao tossir, fazer esforço ou deitar. \nProcurar atendimento imediatamente!",
        "Tente identificar e evitar fatores que causam a dor: estresse, jejum prolongado, privação de sono, consumo excessivo de álcool ou cafeína.",
        "Fique em um quarto escuro e silencioso, e tente repousar. Isso pode ajudar a dor a passar mais rápido.",
        "Busque avaliação longitudinal em Unidade de Saúde para, se necessário, profilaxia de novas crises."
      ]
    },
    "Dor Muscular": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 a 07 dias. (Se sonolência, partir o comprimido)",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Repouso relativo: Evite exercícios pesados ou movimentos que causem dor. Faça alongamentos leves para não enrijecer o músculo",
        "Use compressas de gazes, banhadas em soro fisiológico frio, para auxílio à melhora da dor e redução do inchaço",
        "Retorne imediatamente se surgimento de inchaço repentino com dor intensa; Ou apresentar febre alta ou mal-estar muito forte; Ou surgir formigamento ou dormência que não existiam antes"
      ]
    },
    "GECA": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": 0.6
        },
        {
          "nome": "Enterogermina Plus",
          "qtde": "04 Flaconetes",
          "posologia": "Tomar 01 Flaconete ao dia, por 04 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ondansetrona 8mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, após as refeições, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Soro de Reidratação Oral",
          "qtde": "08 Sachês",
          "posologia": "Diluir cada sachê em 01 Litro de água, tomar várias vezes ao dia.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Beba o Soro de Reidratação Oral e outros líquidos (água, água de coco, sucos naturais), em pequenas quantidades, mas com muita frequência. \nBeba após cada episódio de vômito ou diarreia.",
        "Mantenha alimentação habitual, mas evite alimentos gordurosos, condimentados ou com muito açúcar.",
        "Retorne imediatamente se \n1. Tiver vômitos frequentes que te impeçam de beber líquidos\n2. Apresentar muita sede, com a boca seca ou com pouca urina\n3. Tiver fezes com sangue ou muco\n4. Sentir dor forte na barriga, que não passe com as medicações",
        "A diarreia costuma durar até 07 dias. Se durar mais de 14 dias, retorne para ser reavaliado."
      ]
    },
    "DRGE": {
      "meds": [
        {
          "nome": "Omeprazol 20mg",
          "qtde": "120 Comprimidos",
          "posologia": "Tomar 2 comprimidos ao dia, pela manhã, em jejum, 30 min antes de comer. Usar por 08 semanas.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Domperidona 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, 30 minutos antes das principais refeições.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Eleve a cabeceira da cama aproximadamente 15cm. Pode-se colocar tijolos abaixo dos pés da cama (da cabeceira). Outra opção é usar almofadas e travesseiros para a cabeça ficar em um nível mais elevado ao deitar.",
        "Evite gorduras, bebidas cítricas, alcoólicas e gaseificado, café, menta, hortelã, molho de tomate, chocolates, balas e doces, condimentos em excesso e outros alimentos que pioram os sintomas.",
        "Faça refeições pequenas e mastigue devagar. Evite encher demais o estômago",
        "Evite deitar-se ou realizar exercícios físicos até 2 horas após as refeições",
        "Evite roupas e cintos apertados",
        "Mantenha o peso adequado",
        "Retorne imediatamente se:\n1. Tiver vômitos com sangue ou com aparência de borra de café\n2. Tiver fezes pretas e com mau cheiro\n3. Sentir dor intensa no peito ou na barriga, que não melhorem com o remédio",
        "Fundamental que procure acompanhamento longitudinal em Unidade de Saúde, para dar continuação ao tratamento."
      ]
    },
    "Dengue": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Soro de Reidratação Oral",
          "qtde": "04 Sachês",
          "posologia": "Diluir e consumir livremente.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Manhã",
          "qtde": "Por 07 dias",
          "posologia": "DOSE mL de soro e  DOSE mL de líquidos caseiros (água, sucos, água de coco, Gatorade, chás...)",
          "via": "Para Hidratação",
          "fator": 10
        },
        {
          "nome": "Tarde",
          "qtde": "Por 07 dias",
          "posologia": "DOSE mL de soro e DOSE mL de líquidos caseiros",
          "via": "Para Hidratação",
          "fator": 10
        },
        {
          "nome": "Noite",
          "qtde": "Por 07 dias",
          "posologia": "DOSE mL de soro e DOSE mL de líquidos caseiros",
          "via": "Para Hidratação",
          "fator": 10
        }
      ],
      "orientacoes": [
        "O soro caseiro pode ser preparado com:",
        "1 copo de água filtrada e limpa",
        "1 colher das de café de sal de cozinha",
        "1 colher das de chá de açúcar.",
        "Coloque 3 a 5 gotas de limão para melhorar a diarreia.",
        "A alimentação não deve ser interrompida.",
        "Manter hidratação rigorosa (mínimo 2,5L/dia).",
        "Evitar AAS/AINEs (Risco de sangramento).",
        "Monitorar sinais de alarme: dor abdominal intensa, vômitos persistentes, sangramentos."
      ]
    },
    "Mastite": {
      "meds": [
        {
          "nome": "Cefalexina 500mg",
          "qtde": "40 Comprimidos",
          "posologia": "Tomar 01 Comprimido, de 06/06 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Paracetamol 500mg",
          "qtde": "30 Comprimidos",
          "posologia": "Tomar 01 Comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Conjuntivite viral": {
      "meds": [
        {
          "nome": "Lacrifilm",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, em cada olho, de 04/04 horas ou sempre que necessário",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Olopatadina 1 mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, no olho acometido, de 08/08 horas, por 07 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Fazer compressa fria, sobre os olhos com Soro Fisiológico, para melhorar os sintomas",
        "Lave as mãos frequentemente, com água e sabão, especialmente após tocar os olhos.",
        "Use toalhas de papel para secar o rosto ou troque a toalha de banho e a fronha do travesseiro todos os dias.",
        "Evite apertos de mão, contato próximo e não compartilhe itens pessoais. Se possível evite locais com aglomerações, nos próximos 5 a 7 dias.",
        "Retorne imediatamente se:\n1. Sentir dor intensa no olho\n2. A visão ficar embaçada, turva ou diminuir de forma repentina\n3. O olho inchar muito ou ficar sensível a luz",
        "Evite usar maquiagens nos olhos ou lentes de contato, durante este período da infecção.",
        "O quadro costuma melhorar sozinho e em 05 a 10 dias. Se secreção amarelada, retorne para reavaliação."
      ]
    },
    "Sinusite bomba": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Amoxicilina/Clavulanato 875/125 mg",
          "qtde": "30 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Prednisona 20mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 02 comprimidos, pela manhã, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, uma vez ao dia, se necessário",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Budesonida 50mcg",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 02 jatos, em cada narina, de 12/12 horas",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Lavagem Nasal",
          "qtde": null,
          "posologia": "Realizar lavagem nasal, com Soro Fisiológico, várias vezes ao dia.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Este quadro leva tempo para melhorar. É esperado que ocorra redução da dor e da congestão após 03 a 05 dias de tratamento.",
        "Retorne imediatamente se:\n1. Inchaço ou vermelhidão na pálpebra ou ao redor dos olhos\n2. Visão dupla ou dificuldade para mover os olhos\n3. Dor de cabeça súbita e forte, confusão ou vômitos persistentes\n4. Febre alta que não passa",
        "Mantenha ingestão de ao menos 3 litros de água, diariamente. Não fume.",
        "Se não houver melhora dos sintomas após 07 dias, retorne à Unidade de Saúde para reavaliação."
      ]
    },
    "ITU": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 06/06 horas, se dor ou febre",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Fosfomicina Trometamol 3g",
          "qtde": "01 Sachê",
          "posologia": "Antes de dormir, urinar, depois em um copo de água filtrada, tomar conteúdo diluído do sachê. Não urinar até a próxima manhã.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Pyridium 200mg",
          "qtde": "18 Drágeas",
          "posologia": "Tomar 01 drágea, de 08/08 horas, por 03 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Beba, no mínimo, 2 a 3 litros de água por dia. Isso ajuda a \"lavar\" as bactérias da bexiga",
        "A urina ficará com coloração laranja/avermelhada por causa de um dos medicamentos, isso é esperado",
        "Retorne imediatamente se:\n1. Febre (>37,8°)\n2. Sentir dor forte nas costas\n3. Vômitos ou mal estar muito intenso",
        "Se os sintomas de dor ao urinar ou urgência não melhorarem após 48 horas do início do tratamento, retorne para reavaliação."
      ]
    },
    "Alergia ocular": {
      "meds": [
        {
          "nome": "Olopatadina 1 mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, no olho acometido, de 12/12 horas, por 05 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Lacrifilm",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, em cada olho, de 04/04 horas ou sempre que necessário",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Fazer compressa, com gaze, de soro fisiológico gelado. Aplicar várias vezes ao dia, até melhora do quadro."
      ]
    },
    "Vertigem": {
      "meds": [
        {
          "nome": "Meclin 25mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se náuseas ou vômitos",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Cinarizina 25 mg",
          "qtde": "06 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 03 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Domperidona 10mg",
          "qtde": "01 Caixa",
          "posologia": "Se náuseas persistentes, tomar 01 comprimido, de 08/08 horas, intercalado com Meclin.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Espera-se que seu quadro de tontura se resolva nos próximos dias.",
        "Evitar condução de veículos até melhora completa",
        "Buscar avaliação em Unidade de Saúde para estudo da causa",
        "Quando a tontura começar, sente-se ou deite-se imediatamente, olhando para um ponto fixo.",
        "Evite movimentos bruscos da cabeça.",
        "Retorne imediatamente se:\n1. Tontura acompanhada de visão dupla, dificuldade para falar ou fraqueza em um lado do corpo.\n2. Perda da consciência ou desmaios\n3. Tontura muito forte, que não melhore após 48 horas da medicação."
      ]
    },
    "Meniere": {
      "meds": [
        {
          "nome": "Meclin 25mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se náuseas ou vômitos",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Domperidona 10mg",
          "qtde": "01 Caixa",
          "posologia": "Se náuseas persistentes, tomar 01 comprimido, de 08/08 horas, intercalado com Meclin.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Betahistina 16 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar consumo de mais de 2g de sal no dia, cafeína, álcool e cigarro.",
        "Hidratação adequada",
        "Controle de estresse e sono regular",
        "O tratamento visa reduzir frequência e intensidade das crises, mas não cura",
        "Retorno IMEDIATO se houver: diplopia, disartria, déficit neurológico, perda auditiva súbita, vertigem prolongada >24 h",
        "Buscar avaliação em Unidade de Saúde para acompanhamento longitudinal"
      ]
    },
    "Faringoamigdalite": {
      "meds": [
        {
          "nome": "Amoxicilina 50mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Tomar DOSE mL, de 08/08 horas, por 10 dias.",
          "via": "Oral",
          "fator": 0.33
        },
        {
          "nome": "Flogoral",
          "qtde": "01 Caixa",
          "posologia": "Consumir 01 pastilha, de 06/06 horas, se dor na garganta.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500 mg/mL",
          "qtde": "01 Caixa",
          "posologia": "Tomar DOSE gotas, de 06/06 horas, se dor ou febre (Temperatura axilar maior ou igual a 37,8ºC)",
          "via": "Oral",
          "fator": 0.6
        }
      ],
      "orientacoes": []
    },
    "Broncoespasmo": {
      "meds": [
        {
          "nome": "Dipirona 500 mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Tomar DOSE gotas, de 06/06 horas, se dor ou febre (Temperatura axilar maior ou igual a 37,8ºC)",
          "via": "Oral",
          "fator": 0.6
        },
        {
          "nome": "Prednisolona 3mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Tomar DOSE mL, pela manhã, por 05 dias",
          "via": "Oral",
          "fator": 0.3
        },
        {
          "nome": "Salbutamol 100mcg Spray",
          "qtde": "01 Frasco",
          "posologia": "Inalar 04 jatos, de 2/2 horas, se tosse, chieira ou falta de ar.",
          "via": "Inalatório",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Asma": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar até 02 comprimidos, de 06/06 horas, se dor ou febre",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Prednisona 20mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, durante 05 dias",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Salbutamol 100mcg",
          "qtde": "01 Frasco",
          "posologia": "Inalar 04 jatos, de 06/06 horas, se tosse persistente, chieira no peito ou falta de ar.",
          "via": "Inalatório",
          "fator": null
        },
        {
          "nome": "Clenil HFA 50 mcg",
          "qtde": "Contínuo",
          "posologia": "Inalar 02 jatos, de 12/12 horas.",
          "via": "Inalatório",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Candidíase": {
      "meds": [
        {
          "nome": "Nistatina Pomada 25.000u/g",
          "qtde": null,
          "posologia": "Aplicar na vagina ao deitar, por 14 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Fluconazol 150 mg",
          "qtde": "01 Comprimido",
          "posologia": "Tomar 01 comprimido.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Cerume": {
      "meds": [
        {
          "nome": "Cerumin",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 03 gotas no ouvido acometido, de 08/08 horas, por 5 a 7 dias.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Agendar lavagem do conduto auditivo em UBS."
      ]
    },
    "Cervicalgia": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 02 comprimidos, de 06/06 horas, se dor",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Trometamol Cetorolaco 10mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "COVID": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 02 comprimidos, de 06/06 horas, se dor",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido ao dia, durante 05 dias, se coriza ou espirros",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Trometamol Cetorolaco 10mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter hidratação e alimentação balanceadas",
        "Manter repouso relativo",
        "Em caso de falta de ar intensa, prostração ou febre persistente, retornar à UPA para nova avaliação"
      ]
    },
    "PEP": {
      "meds": [
        {
          "nome": "Lamivudina / Tenofovir 300mg/300mg",
          "qtde": "28 Comprimidos",
          "posologia": "Tomar 01 comprimido ao dia, por 28 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dolutegravir 50 mg",
          "qtde": "28 Comprimidos",
          "posologia": "Tomar 01 comprimido ao dia, por 28 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Realizar agendamento de atendimento em centro Viva Vida, conforme orientação entregue em consultório."
      ]
    },
    "Constipação": {
      "meds": [
        {
          "nome": "Lactulose 667 mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Tomar 15mL de 12/12 horas, até melhora dos sintomas.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Buscopam composto",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido de 08/08 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Simeticona 75mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Tomar 30 gotas, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Aumentar consumo de alimentos ricos em fibras",
        "Aumentar exponencialmente o consumo de água."
      ]
    },
    "Costocondrite": {
      "meds": [
        {
          "nome": "Cetoprofeno 100mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido de 12/12 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias. (Se sonolência excessiva no próximo dia, favor tomar meio comprimido).",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Corpo estranho": {
      "meds": [],
      "orientacoes": [
        "Molhar gases em soro fisiológico frio, e aplicar suavemente sobre o olho acometido, para alívio da dor e do incômodo."
      ]
    },
    "Dermatite": {
      "meds": [
        {
          "nome": "Prometazina 25mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, pela manhã, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Prednisona 20mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 02 comprimidos, pela manhã, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Acetato de Hidrocortisona (Creme 10mg)",
          "qtde": "01 Tubo",
          "posologia": "Aplicar fina camada, de 06/06 horas, massageando sobre a lesão. \nApós melhora dos sintomas, aplicar 01 vez ao dia.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Diverticulite": {
      "meds": [
        {
          "nome": "Ciprofloxacino 500mg",
          "qtde": "28 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 14 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Metronidazol 500mg",
          "qtde": "36 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 14 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Bromoprida 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se náuseas ou vômitos.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Dor Abdominal": {
      "meds": [
        {
          "nome": "Tropinal",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor abdominal, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Metoclopramida 10 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se náuseas ou vômitos.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Faringite": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se dor forte. Por no máximo 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Flurbiprofeno 8,75mg",
          "qtde": "01 Caixa",
          "posologia": "Consumir 01 pastilha de 08/08 horas, até melhora do desconforto",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Permanecer em repouso pelos próximos 03 dias.",
        "Preferir alimentos não ácidos e frios, para melhora da dor. Evitando assim café, refrigerante e frituras"
      ]
    },
    "Otite média": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Amoxicilina e Clavulanato 875/125 mg",
          "qtde": "20 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Omeprazol 20mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, pela manhã em jejum, se queimação ou desconforto estomacal.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Otociriax",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 03 gotas no ouvido acometido de 12/12 horas, por 07 dias.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Após aplicar medicação no ouvido, permanecer deitado por lado acometido para cima, por 05 minutos, para absorção da medicação",
        "Não mergulhar ou praticar atividades aquáticas pelos próximos 30 dias."
      ]
    },
    "SUA": {
      "meds": [
        {
          "nome": "Tropinal",
          "qtde": "01 Caixa",
          "posologia": "Tomar 02 comprimidos de 08/08 horas, se dor abdominal, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ácido Mefenamico 500 mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ácido Tranexâmico 250mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Levonogestrel 150 mcg + Etinilestradiol 30 mcg",
          "qtde": "21 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, até cessamento do sangramento ou 07 dias (o que ocorrer primeiro).",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Levonogestrel 150 mcg + Etinilestradiol 30 mcg",
          "qtde": "Contínuo",
          "posologia": "Tomar 01 comprimido ao dia, no mesmo horário, por 03 meses",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Realizar acompanhamento longitudinal em unidade de saúde para estudo da causa do sangramento.",
        "Se piora do sangramento, sonolência ou tontura, procurar o pronto socorro imediatamente."
      ]
    },
    "Herpes Zoster": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Paracetamol 500mg",
          "qtde": "01 Caixa",
          "posologia": "Se não melhora da dor dom Dipirona, intercalar com tomada 01 comprimido, de 06/06 horas.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Aciclovir 400mg",
          "qtde": "70 Comprimidos",
          "posologia": "Tomar 02 comprimido, 05 vezes ao dia (de 04/04 horas), por 07 dias",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Prednisona 20mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 02 comprimidos, pela manhã, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Amitriptilina 25mg",
          "qtde": "Contínuo",
          "posologia": "Tomar 01 comprimido pela noite",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Tramadol 50mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido de 06/06 horas, se dor forte que não melhore com as terapias acima.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Lidocaína Gel 5%",
          "qtde": "01 Tubo",
          "posologia": "Aplicar fina camada sobre a área dolorosa, até 4 vezes ao dia, conforme dor.\nUso exclusivamente tópico, em pele cicatrizada.\nEvitar cobertura oclusiva prolongada.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar estímulos mecânicos ou térmicos na área afetada",
        "Manter hidratação cutânea e higiene local",
        "Realizar acompanhamento em Unidade Básica de Saúde, para manejo longitudinal"
      ]
    },
    "Vaginose Bacteriana": {
      "meds": [
        {
          "nome": "Metronidazol 250 mg",
          "qtde": "28 Comprimidos",
          "posologia": "Tomar 02 comprimido, de 12/12 horas, por 07 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Hordéolo": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Carmelose Sódica",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, no olho acometido, sempre que ardência ou irritação local.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Tobramicina 0,3% Pomada",
          "qtde": "01 Tubo",
          "posologia": "Aplicar, aproximadamente, 01 cm da pomada, de 06/06 horas, por 07 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Compressas Mornas",
          "qtde": null,
          "posologia": "Aplicar compressas, de gazes, em soro fisiológico morno, sobre a região acometida, até 04 vezes ao dia.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Picada": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se dor",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Valerato de Betametasona 1mg/g Pomada",
          "qtde": "01 Tubo",
          "posologia": "Aplicar fina camada, sobre lesão, de 12/12 horas, por até 05 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Compressas Frias",
          "qtde": null,
          "posologia": "Aplicar compressas de gazes, em soro fisiológico frio, sobre a região acometida, até 04 vezes ao dia, por 10 minutos cada, para redução do inchaço e da coceira",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar coçar ou manipular a lesão",
        "Manter o local limpo e seco",
        "Procurar o pronto atendimento imediatamente, se:",
        "Inchaço de face, lábios ou garganta",
        "Dificuldade para respirar",
        "Surgimento de pus na lesão ou febre ou dor progressiva"
      ]
    },
    "Insuficiência venosa": {
      "meds": [
        {
          "nome": "Diosmina + Hesperidina 900/100mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 14 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor para a movimentação das pernas.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Meloxicam 7,5mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, uma vez ao dia, por até 10 dias, se a dor impedir a movimentação das pernas",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Meias de Compressão Graduada 3/4 - 20 a 30 mmHg",
          "qtde": "01 Unidade",
          "posologia": "Iniciar o uso pela manhã, antes de iniciar a movimentação e retirar no período da noite.",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "Elevar os pés acima do nível do coração por 30 minutos, 03 vezes ao dia, especialmente após caminhadas.",
        "Caminhadas leves e curtas, várias vezes ao dia, para estimular o retorno do sangue.",
        "Exercícios ativos de flexão/extensão do tornozelo em pé ou sentado",
        "Evitar ficar longos períodos em pé ou sentado sem movimentação (+ 30 minutos).",
        "Agendar avaliação em Unidade de Saúde para acompanhamento longitudinal."
      ]
    },
    "Herpes genital": {
      "meds": [
        {
          "nome": "Aciclovir 400mg",
          "qtde": "21 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 7 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 08/08 horas, se dor que não melhore apesar do uso de dipirona.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Banho de assento em água morna",
          "qtde": null,
          "posologia": "Em água morna, realizar banho de assento, ao menos 02 vezes ao dia, para melhora do incômodo",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "O tratamento deve ser iniciado o mais precocemente possível.",
        "Utilizar preservativo em caso de atividade sexual.",
        "Realizar acompanhamento longitudinal em unidade de saúde para avaliação do quadro e orientação quanto a prevenção e fatores desencadeantes."
      ]
    },
    "Hemorroidas": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas se, apesar do uso de dipirona, permanecer com dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Proctfis H ou Similar",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar 02 cm de pomada na região acometida, seguido de massagem local, de 08/08 horas por 05 dias, se dor ou coceira local",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Diosmina + Hesperidina 450/50 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 07 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Banho de assento",
          "qtde": null,
          "posologia": "Em água morna, realizar banho de assento, 02 a 03 vezes ao dia, por 10 a 15 minutos.",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar realizar esforço evacuatório prolongado.",
        "Se em momentos de constipação intestinal, procurar atendimento médico para manejo.",
        "Aumentar consumo de fibras (Frutas e verduras)",
        "Incrementar a ingesta hídrica, no mínimo de 2 L diariamente.",
        "Procurar acompanhamento longitudinal em Unidade de Saúde."
      ]
    },
    "Gota": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Naproxeno 500 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Colchicina 0,5mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 02 comprimidos agora, após 01 hora tomar mais 01 comprimido. \nNas próximas 06 semanas, tomar 01 comprimido, de 12/12 horas.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Prednisolona 20mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido e meio, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Elevar a articulação afetada",
        "Aplicar compressas frias no local, de 10 a 15 minutos, de 02 a 03 vezes ao dia.",
        "Não ingerir álcool, reduzir ingesta de carne vermelha, frutos do mar e bebidas açucaradas.",
        "Torne a buscar atendimento médico de dor intensa, febre ou mudança no padrão da inflamação."
      ]
    },
    "Nefrolitíase": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Trometamol Cetorolaco 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 06/06 horas, se dor importante, por no máximo 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Tramadol 50mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 04/04 horas, se dor forte, apesar do uso de dipirona e cetorolaco.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Tansulozina 0.4mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, após o café da manhã, por 04 semanas.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "É imprescindível a realização do estudo de imagem para confirmação e posterior localização do cálculo",
        "Proceder investigação em Unidade de Saúde, para profilaxia de cálculos",
        "Muito importante manter hidratação abundante de, no mínimo, 03 litros de água, diariamente."
      ]
    },
    "Alergia": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Valerato de Betametasona 1mg/g Pomada",
          "qtde": "01 Tubo",
          "posologia": "Aplicar fina camada, sobre lesão, de 12/12 horas, por até 05 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Compressas Frias",
          "qtde": null,
          "posologia": "Aplicar compressas de gazes, em soro fisiológico frio, sobre a região acometida, até 04 vezes ao dia, por 10 minutos cada, para redução do inchaço e da coceira",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Ansiedade": {
      "meds": [
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido antes de dormir, por 05 dias. \nSe muita sonolência no próximo dia, tomar apenas meio comprimido.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    },
    "Gripe": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, ao dia, preferencialmente à noite, enquanto persistirem os sintomas, ao máximo de 07 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Budesonida 50mcg",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 02 jatos em cada narina, de 08/08 horas, por 02 semanas, para descongestão.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Soro Fisiológico 0,9%",
          "qtde": "01 Frasco",
          "posologia": "Realizar lavagem nasal, com seringa, conforme explicado em consultório, várias vezes ao dia, para higiene.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter hidratação abundante e repouso relativo",
        "Evitar exposição ao frio e mudanças bruscas de temperatura",
        "Procurar avaliação médica se febre persistente por mais de 72 horas, dificuldade para respirar ou secreção nasal purulenta"
      ]
    },
    "Queimadura": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Sulfadiazina de prata 1% - Creme",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar fina camada, sobre áreas afetadas, de 12/12 horas, após limpeza local com soro fisiológico",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Lavar área afetada apenas com água corrente e sabão neutro",
        "Evitar romper bolhas, aplicar pomadas caseiras ou expor região ao sol",
        "Manter local limpo, coberto com gaze estéril.",
        "Trocar curativo diariamente",
        "Procurar atendimento médico se formação de bolhas, secreção, febre ou aumento da dor."
      ]
    },
    "TCE": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Meclin 25mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se náuseas ou tonturas",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter repouso relativo nas primeiras 24 horas",
        "Evitar atividades físicas intensas, uso de bebidas alcoólicas e medicações aqui não prescritas",
        "Retornar para reavaliação se",
        "Sonolência excessiva // Confusão // Vômitos persistentes // Fraqueza em membros // Convulsões // Saída de líquido pelo ouvido ou nariz"
      ]
    },
    "Ferimento": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Neomicina 5mg + Bacitracina 250UI/g Pomada",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar fina camada sobre ferida, após limpeza local, de 12/12 horas, por 10 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Clorexidina aquosa 0,5% - Solução",
          "qtde": "01 Frasco",
          "posologia": "Lavar a ferida com soro fisiológico e, em seguida, aplicar a solução de clorexidina de 12/12 horas, até cicatrização",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter local da ferida sempre limpo e seco",
        "Trocar de curativo diariamente",
        "Evitar exposição solar direta e traumas locais",
        "Retornar para avaliação médica se houver dor intensa, secreção amarelada ou febre.",
        "Realizar reforço de vacinação antitetânica (dT) em unidade de saúde."
      ]
    },
    "Micose": {
      "meds": [
        {
          "nome": "Cetoconazol 2% Creme",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar fina camada sobre lesão e 02 cm ao redor, 01 vez ao dia, por 02 semanas.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Terbinafina 250mg (Se resistente)",
          "qtde": "30 Comprimidos",
          "posologia": "Tomar 01 comprimido ao dia, por 30 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter pele limpa e seca, especialmente entre os dedos.",
        "Evitar o uso de calçados fechados por longos períodos",
        "Trocar de meias diariamente",
        "Lavar roupas e toalhas em água quente para evitar reinfecção"
      ]
    },
    "Abcesso": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Cefalexina 500mg",
          "qtde": "28 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, por 07 dias",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Aplicar compressas de gazes, banhadas em soro fisiológico morno, na região, de 06/06 horas por 15 minutos.",
        "Manter local limpo e seco.",
        "NÃO MANIPULAR O LOCAL",
        "Procurar atendimento médico se aumento rápido do volume, febre ou dor intensa."
      ]
    },
    "Escabiose": {
      "meds": [
        {
          "nome": "Permetrina 5% - Creme",
          "qtde": "01 Bisnaga",
          "posologia": "Utilizar em toda extensão das regiões acometidas, aplicando antes de dormir, realizar por 2 noites. Após 01 semana, utilizar novamente por uma noite.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Ivermectina 6mg",
          "qtde": "02 Comprimidos",
          "posologia": "Se > 15 kg. Tomar 01 comprimido agora, tomar segundo comprimido em 07 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Hidroxizina 25 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, antes de dormir, pelas próximas 02 noites, se coceira",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Tratar todos do mesmo domicílio",
        "Lavar todas as roupas de cama em água quente para evitar reinfecção",
        "Evitar contato próximo com pessoas não tratadas, até o fim da terapia.",
        "coceira pode persistir por 02 a 03 semanas após o tratamento.\nNão significando falha do remédio"
      ]
    },
    "Impetigo": {
      "meds": [
        {
          "nome": "Mupirocina 2% - Pomada",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar fina camada sobre lesões, de 08/08 horas, por 05 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Cefalexina 500mg",
          "qtde": "28 Comprimidos",
          "posologia": "Se múltiplos locais acometidos: tomar 01 comprimido, de 06/06 horas, por 07 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter a pele limpa",
        "Lavar as lesões com água e sabão neutro antes da aplicação tópica",
        "Evitar manipulação das crostas e contato direto com outras pessoas, até a melhora",
        "Lavar roupas, toalhas e lençóis frequentemente",
        "Procurar atendimento médico se aumento rápido do número de lesões, febre ou muita dor."
      ]
    },
    "Tosse": {
      "meds": [
        {
          "nome": "Prednisona 20mg",
          "qtde": "14 Comprimidos",
          "posologia": "Tomar 02 comprimidos, pela manhã, por 07 dias",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Mantener grande ingesta hídrica, de ao menos 02 litros",
        "Não se exponha a fumaça de cigarro e à ambientes poluídos.",
        "Procurar atendimento médico se febre, expectoração purulenta, dificuldade de respirar ou tosse intensa que interfira nas atividades diárias."
      ]
    },
    "Entorse": {
      "meds": [
        {
          "nome": "Diclofenaco dietilamônio 11,6 mg/g - Gel",
          "qtde": "01 Frasco",
          "posologia": "Aplicar fina camada sobre área afetada, de 08/08 horas, por 05 dias.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 02 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter-se em repouso",
        "Aplicar compressas de gases, banhadas em soro fisiológico frio, de 06/06 horas, por 15 minutos.",
        "Manter o membro elevado acima do nível do coração",
        "Evitar esforços físicos e esportes por 48 a 72 horas",
        "Procurar avaliação médica se aumento da dor, inchaço significativo e dificuldade para caminhar."
      ]
    },
    "Xeroftalmia": {
      "meds": [
        {
          "nome": "Lacrifilm",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota sobre ambos olhos, de 04/04 horas, até melhora do desconforto",
          "via": "Oftálmico",
          "fator": null
        },
        {
          "nome": "Hialuronato de sódio 0,15% - Gel",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 vez ao dia, preferencialmente à noite, para lubrificação prolongada",
          "via": "Oftálmico",
          "fator": null
        },
        {
          "nome": "Olopatadina 1 mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 vez no olho acometido, de 08/08 horas, por 05 dias.",
          "via": "Oftálmico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter colírios refrigerados",
        "Evitar exposição prolongada a ambientes secos, vento ou ar-condicionado",
        "Piscar regularmente durante o uso de telas",
        "Retornar a esta unidade se dor ocular intensa, vermelhidão significativa, secreção ou alterações visuais",
        "Buscar acompanhamento longitudinal em Unidade de Saúde para controle da causa"
      ]
    },
    "Pé diabético": {
      "meds": [],
      "orientacoes": [
        "Manter controle glicêmico rigoroso",
        "Evitar aplicar pressão sobre o pé afetado",
        "Higienizar o pé diariamente com água morna e sabão neutro",
        "Manter pele seca e protegida",
        "Buscar imediatamente acompanhamento longitudinal em Unidade Básica de Saúde"
      ]
    },
    "Prurido Inespecífico": {
      "meds": [
        {
          "nome": "Loratadina 10mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, ao dia, antes de dormir, por 07 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Hidroxizina 25 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, se coceira intensa que interfere no sono.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Valerato de Betametasona 1mg/g Pomada",
          "qtde": "01 Tubo",
          "posologia": "Aplicar fina camada, sobre as áreas com lesão, de 12/12 horas, por 05 dias.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar banhos quentes e uso de sabonetes agressivos",
        "Manter a pele hidratada com cremes neutros.",
        "Buscar avaliação em Unidade de Saúde para estudo da causa de base"
      ]
    },
    "Esofagite por Cândida": {
      "meds": [
        {
          "nome": "Fluconazol 150 mg",
          "qtde": "02 Comprimidos",
          "posologia": "Tomar 01 comprimido no dia 01 e outro no dia 07.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Omeprazol 20mg",
          "qtde": "30 Comprimidos",
          "posologia": "Tomar 01 comprimido, pela manhã em jejum, por 30 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar alimentos ácidos e muito condimentados.",
        "Manter higiene oral rigorosa",
        "Retornar ao serviço médico se disfagia intensa ou febre."
      ]
    },
    "Cefaleia Tensional": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, até de 08/08 horas, se dor que não melhore com Dipirona.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias (se dor e tensão muscular).",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar estresse, manter boa higiene do sono e postura.",
        "Utilizar compressas mornas na região cervical/têmporas",
        "Retornar se sintomas de alerta (os mesmos listados para Enxaqueca)"
      ]
    },
    "Crise Hipertensiva": {
      "meds": [
        {
          "nome": "Captopril 25mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido. Repetir após 30 minutos se pressão arterial ainda elevada (acima de 160x100 mmHg).",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor de cabeça.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar realizar esforços físicos intensos.",
        "Agendar consulta em Unidade de Saúde para ajuste de medicação anti-hipertensiva.",
        "Retornar ao serviço médico se: falta de ar, dor no peito, alteração visual ou neurológica."
      ]
    },
    "Hipocalcemia": {
      "meds": [
        {
          "nome": "Carbonato de Cálcio 500mg",
          "qtde": "60 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Vitamina D 10.000 UI",
          "qtde": "04 Cápsulas",
          "posologia": "Tomar 01 cápsula, 01 vez por semana, por 04 semanas.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter dieta rica em laticínios.",
        "Realizar acompanhamento laboratorial (Cálcio iônico) em 07 dias."
      ]
    },
    "Dismenorreia Secundária": {
      "meds": [
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, iniciando 01 dia antes do ciclo, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Buscopam composto",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, se dor abdominal intensa.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Aplicar compressas quentes na região pélvica.",
        "Buscar avaliação ginecológica para estudo da causa (ex: Endometriose, miomas)."
      ]
    },
    "Colite Inespecífica": {
      "meds": [
        {
          "nome": "Trimebutina 200mg",
          "qtde": "30 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Simeticona 75mg/mL",
          "qtde": "01 Frasco",
          "posologia": "Tomar 30 gotas, de 08/08 horas.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter dieta leve, evitando laticínios e alimentos gordurosos.",
        "Procurar atendimento médico se febre, sangramento retal ou dor intensa e progressiva."
      ]
    },
    "Alopecia Areata": {
      "meds": [
        {
          "nome": "Valerato de Betametasona 1mg/g Pomada",
          "qtde": "01 Tubo",
          "posologia": "Aplicar fina camada, sobre a placa de alopecia, de 12/12 horas, por 30 dias.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar traumas e manipulação do couro cabeludo.",
        "Buscar avaliação dermatológica para acompanhamento e possíveis terapias adicionais."
      ]
    },
    "Uveíte Anterior": {
      "meds": [
        {
          "nome": "Prednisolona 1% - Colírio",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota no olho acometido, de 06/06 horas, por 07 dias.",
          "via": "Oftálmico",
          "fator": null
        },
        {
          "nome": "Ciclopentolato 1% - Colírio",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota no olho acometido, 01 vez ao dia, ao deitar, por 05 dias.",
          "via": "Oftálmico",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Encaminhamento **IMEDIATO** para avaliação oftalmológica especializada (acompanhamento de PIO)."
      ]
    },
    "Dedo em Gatilho": {
      "meds": [
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Tala de Imobilização (PVC)",
          "qtde": "01 Unidade",
          "posologia": "Utilizar imobilização noturna para manter o dedo esticado.",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar movimentos repetitivos ou de preensão forte com o dedo.",
        "Buscar avaliação ortopédica."
      ]
    },
    "Bursite Olecraniana": {
      "meds": [
        {
          "nome": "Cetoprofeno 100mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido de 12/12 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Compressas Frias",
          "qtde": null,
          "posologia": "Aplicar compressas frias sobre o cotovelo, de 08/08 horas, por 15 minutos.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar apoiar o cotovelo em superfícies rígidas."
      ]
    },
    "Sinusite Odontogênica": {
      "meds": [
        {
          "nome": "Amoxicilina + Clavulanato 875/125 mg",
          "qtde": "20 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Lavagem Nasal",
          "qtde": null,
          "posologia": "Realizar lavagem nasal com Soro Fisiológico, várias vezes ao dia.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Encaminhamento urgente para avaliação odontológica (tratamento da causa)."
      ]
    },
    "Mononucleose Infecciosa": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Flurbiprofeno 8,75mg",
          "qtde": "01 Caixa",
          "posologia": "Consumir 01 pastilha, de 08/08 horas, se dor na garganta.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar exercícios físicos por 03 a 04 semanas (risco de ruptura esplênica).",
        "Manter repouso relativo e hidratação adequada.",
        "Retornar imediatamente se dor abdominal intensa no quadrante superior esquerdo."
      ]
    },
    "Tromboflebite Superficial": {
      "meds": [
        {
          "nome": "Cetoprofeno 100mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Hirudoid Gel",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar sobre a área endurecida, de 08/08 horas, com massagem leve.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Meias de Compressão Graduada",
          "qtde": "01 Unidade",
          "posologia": "Utilizar durante o dia.",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter a perna elevada ao máximo.",
        "Encaminhamento para Angiologia/Cirurgia Vascular."
      ]
    },
    "Varicorragia": {
      "meds": [
        {
          "nome": "Diosmina + Hesperidina 900/100mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 14 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Curativo",
          "qtde": null,
          "posologia": "Manter curativo limpo e compressivo no local do sangramento.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Meias de Compressão Graduada",
          "qtde": "01 Unidade",
          "posologia": "Utilizar durante o dia.",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "Repouso com as pernas elevadas",
        "Encaminhamento urgente para Cirurgia Vascular."
      ]
    },
    "Herpes Simples Labial": {
      "meds": [
        {
          "nome": "Aciclovir 400mg",
          "qtde": "35 Comprimidos",
          "posologia": "Tomar 01 comprimido, 05 vezes ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Aciclovir 5% - Pomada",
          "qtde": "01 Bisnaga",
          "posologia": "Aplicar fina camada, de 04/04 horas, sobre as lesões.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar contato da lesão com outras pessoas (beijos, compartilhamento de talheres)."
      ]
    },
    "Paralisia de Bell": {
      "meds": [
        {
          "nome": "Prednisona 20mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 02 comprimidos, pela manhã, por 05 dias. Depois 01 comprimido por 05 dias. Depois meio comprimido por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Aciclovir 400mg",
          "qtde": "35 Comprimidos",
          "posologia": "Tomar 01 comprimido, 05 vezes ao dia, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Lacrifilm",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, de 04/04 horas, e Pomada Oftálmica à noite (se lagoftalmo/olho seco).",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Proteger o olho (óculos escuros, óculos de natação à noite).",
        "Iniciar fisioterapia facial precoce."
      ]
    },
    "Transtorno de Pânico": {
      "meds": [
        {
          "nome": "Clonazepam 0,5mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, sublingual, somente se crise de ansiedade intensa e isolada.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Fluoxetina 20mg",
          "qtde": "30 Comprimidos",
          "posologia": "Tomar 01 comprimido, pela manhã, por 30 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar cafeína e outras substâncias estimulantes.",
        "Agendar consulta com Psiquiatra/Psicólogo para manejo longitudinal e terapia."
      ]
    },
    "Candidíase Oral": {
      "meds": [
        {
          "nome": "Nistatina Suspensão Oral 100.000 UI/mL",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 1mL na boca, 04 vezes ao dia, mantendo o máximo de tempo possível na lesão, por 07 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Realizar higiene oral adequada (escovação suave e limpeza da prótese, se houver).",
        "Descartar escovas de dente antigas."
      ]
    },
    "Trauma de Face": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Compressas Frias",
          "qtde": null,
          "posologia": "Aplicar compressas frias na região do trauma, de 04/04 horas, por 20 minutos.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter dieta pastosa ou líquida se dor à mastigação.",
        "Retornar se: Visão dupla, dor intensa, sangramento nasal/oral persistente, ou dormência de face."
      ]
    },
    "Amigdalite Crônica Agudizada": {
      "meds": [
        {
          "nome": "Amoxicilina + Clavulanato 875/125 mg",
          "qtde": "20 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Flogoral",
          "qtde": "01 Caixa",
          "posologia": "Consumir 01 pastilha, de 06/06 horas, se dor na garganta.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Agendar consulta com Otorrinolaringologista para avaliação cirúrgica."
      ]
    },
    "Ferimento com Risco de Raiva": {
      "meds": [
        {
          "nome": "Soro Antirrábico",
          "qtde": null,
          "posologia": "Infiltrar a dose calculada na ferida, conforme protocolo do PS.",
          "via": "Injetável",
          "fator": null
        },
        {
          "nome": "Vacina Antirrábica",
          "qtde": null,
          "posologia": "Aplicar a primeira dose e orientar o calendário de doses subsequentes.",
          "via": "Injetável",
          "fator": null
        },
        {
          "nome": "Amoxicilina + Clavulanato 875/125 mg",
          "qtde": "20 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 12/12 horas, por 10 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Monitorar o animal agressor, se possível.",
        "Seguir rigorosamente o protocolo vacinal."
      ]
    },
    "Pós-Extração Dentária": {
      "meds": [
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Amoxicilina 500mg",
          "qtde": "21 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 07 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Aplicar gelo na região da bochecha (face) nas primeiras 24 horas.",
        "Evitar bochechos nas primeiras 24 horas."
      ]
    },
    "Disfunção Temporomandibular": {
      "meds": [
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclobenzaprina 10mg",
          "qtde": "05 Comprimidos",
          "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Dieta pastosa ou líquida nos primeiros dias.",
        "Aplicar calor úmido na região da articulação (ATM).",
        "Buscar avaliação odontológica especializada."
      ]
    },
    "Oftalmia Elétrica": {
      "meds": [
        {
          "nome": "Lacrifilm",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, de 04/04 horas.",
          "via": "Oftálmico",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Ciclopentolato 1% - Colírio",
          "qtde": "01 Frasco",
          "posologia": "Aplicar 01 gota, 01 vez ao dia, ao deitar (se dor intensa).",
          "via": "Oftálmico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Repouso ocular, evitar luz intensa."
      ]
    },
    "Tireoidite Subaguda": {
      "meds": [
        {
          "nome": "Prednisona 20mg",
          "qtde": "15 Comprimidos",
          "posologia": "Tomar 02 comprimidos, pela manhã, por 05 dias. Depois 01 comprimido por 05 dias. Depois meio comprimido por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Agendar controle laboratorial (TSH, T4L) e avaliação com Endocrinologista.",
        "Evitar exercícios extenuantes."
      ]
    },
    "Síndrome do Túnel do Carpo": {
      "meds": [
        {
          "nome": "Ibuprofeno 600 mg",
          "qtde": "10 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Tala de Punho (PVC)",
          "qtde": "01 Unidade",
          "posologia": "Utilizar imobilização noturna para manter o punho em posição neutra.",
          "via": "Externo",
          "fator": null
        }
      ],
      "orientacoes": [
        "Evitar atividades que exijam flexão ou extensão prolongada do punho.",
        "Buscar avaliação ortopédica/neurológica."
      ]
    },
    "Pioderma (Abscesso Pequeno)": {
      "meds": [
        {
          "nome": "Cefalexina 500mg",
          "qtde": "28 Comprimidos",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, por 07 dias.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor ou febre.",
          "via": "Oral",
          "fator": null
        },
        {
          "nome": "Compressas Mornas",
          "qtde": null,
          "posologia": "Aplicar compressas mornas de Soro Fisiológico 0,9% na lesão, de 06/06 horas, por 15 minutos.",
          "via": "Tópico",
          "fator": null
        }
      ],
      "orientacoes": [
        "Manter higiene local rigorosa.",
        "Retornar se dor intensa, febre ou aumento do volume."
      ]
    },
    "Exposição a Agente Químico (Pele/Olho)": {
      "meds": [
        {
          "nome": "Soro Fisiológico 0,9%",
          "qtde": "Contínuo",
          "posologia": "Lavar a área atingida por 15-20 minutos em água corrente e Soro Fisiológico.",
          "via": "Tópico",
          "fator": null
        },
        {
          "nome": "Dipirona 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": [
        "Remover roupas contaminadas.",
        "Não neutralizar com outros agentes químicos.",
        "Encaminhamento para Oftalmologia ou Dermatologia, dependendo da lesão."
      ]
    },
    "Hiperêmese gravídica": {
      "meds": [
        {
          "nome": "Paracetamol 500mg",
          "qtde": "01 Caixa",
          "posologia": "Tomar 01 comprimido, de 06/06 horas, se dor.",
          "via": "Oral",
          "fator": null
        }
      ],
      "orientacoes": []
    }
  },
  "ordemCondicoes": [
    "Enxaqueca",
    "Dor Muscular",
    "GECA",
    "DRGE",
    "Dengue",
    "Mastite",
    "Conjuntivite viral",
    "Sinusite bomba",
    "ITU",
    "Alergia ocular",
    "Vertigem",
    "Meniere",
    "Faringoamigdalite",
    "Broncoespasmo",
    "Asma",
    "Candidíase",
    "Cerume",
    "Cervicalgia",
    "COVID",
    "PEP",
    "Constipação",
    "Costocondrite",
    "Corpo estranho",
    "Dermatite",
    "Diverticulite",
    "Dor Abdominal",
    "Faringite",
    "Otite média",
    "SUA",
    "Herpes Zoster",
    "Vaginose Bacteriana",
    "Hordéolo",
    "Picada",
    "Insuficiência venosa",
    "Herpes genital",
    "Hemorroidas",
    "Gota",
    "Nefrolitíase",
    "Alergia",
    "Ansiedade",
    "Gripe",
    "Queimadura",
    "TCE",
    "Ferimento",
    "Micose",
    "Abcesso",
    "Escabiose",
    "Impetigo",
    "Tosse",
    "Entorse",
    "Xeroftalmia",
    "Pé diabético",
    "Prurido Inespecífico",
    "Esofagite por Cândida",
    "Cefaleia Tensional",
    "Crise Hipertensiva",
    "Hipocalcemia",
    "Dismenorreia Secundária",
    "Colite Inespecífica",
    "Alopecia Areata",
    "Uveíte Anterior",
    "Dedo em Gatilho",
    "Bursite Olecraniana",
    "Sinusite Odontogênica",
    "Mononucleose Infecciosa",
    "Tromboflebite Superficial",
    "Varicorragia",
    "Herpes Simples Labial",
    "Paralisia de Bell",
    "Transtorno de Pânico",
    "Candidíase Oral",
    "Trauma de Face",
    "Amigdalite Crônica Agudizada",
    "Ferimento com Risco de Raiva",
    "Pós-Extração Dentária",
    "Disfunção Temporomandibular",
    "Oftalmia Elétrica",
    "Tireoidite Subaguda",
    "Síndrome do Túnel do Carpo",
    "Pioderma (Abscesso Pequeno)",
    "Exposição a Agente Químico (Pele/Olho)",
    "Hiperêmese gravídica"
  ],
  "medicamentos": [
    {
      "nome": "Acetato de Hidrocortisona Creme",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "01 Tubo",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Aciclovir",
      "concentracao": "400mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Aciclovir",
      "concentracao": "0.05",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Ácido Mefenamico",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "15 Comprimidos",
      "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ácido Tranexâmico",
      "concentracao": "250mg",
      "forma": "",
      "qtde": "15 Comprimidos",
      "posologia": "Tomar 01 comprimido, de 08/08 horas, por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amitriptilina",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amoxicilina",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "30 Comprimidos",
      "posologia": "Tomar 01 comprimido de 08/08 horas por 10 dias",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amoxicilina + Clavulonato comprimido",
      "concentracao": "875/125mg",
      "forma": "",
      "qtde": "20 Comprimidos",
      "posologia": "Tomar 01 comprimido de 12/12 horas por 10 dias",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amoxicilina + Clavulonato xarope",
      "concentracao": "500+125mg/5mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar mL, de 12/12 horas, por 07 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Artrotop",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Banho de Assento",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Betahistina",
      "concentracao": "16mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, de 08/08 horas por 05 dias",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Betametasona Pomada",
      "concentracao": "",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar fina camada em lesões, pela noite, por 05 dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Betatrinta",
      "concentracao": "5mg/2mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicação Intramuscular profunda em glúteo.",
      "tempo": "",
      "via": "Injetável"
    },
    {
      "nome": "Bromoprida",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido de 8/8 horas se náuseas ou vômitos",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Budesonida",
      "concentracao": "50mcg",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Aplicar 02 jatos de 12/12 horas por 03 semanas.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Buscopam Composto",
      "concentracao": "",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, de 08/08 horas, se dor abdominal.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Captopril",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "Contínuo",
      "posologia": "Tomar 02 comprimidos pela manhã contínuo",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carbonato de Cálcio",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carmelose Sódica",
      "concentracao": "",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Aplicar 01 gota no olho acometido de 08/08 horas enquanto perceção de \"areia nos olhos\"",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Cefalexina",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "28 Comprimidos",
      "posologia": "Tomar 02 comprimidos de 12/12 horas por 07 dias",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ceftriaxona",
      "concentracao": "1g",
      "forma": "",
      "qtde": "12 Ampolas",
      "posologia": "Fazer 02 ampolas + 100mL de S.F. 0.9%, de 24/24 horas, por 06 dias.",
      "tempo": "",
      "via": "Intravenoso"
    },
    {
      "nome": "Cerumin",
      "concentracao": "",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Aplicar 03 gotas no ouvido acometido, de 08/08 horas, por 05 a 07 dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Cetoconazol",
      "concentracao": "2% - Creme",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Cetoprofeno",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "",
      "posologia": "Tomar 01 comprimido de 12/12 horas por até 05 dias se dor intensa.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ciclobenzaprina",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias. (Se muita sonolência no próximo dia, então tomar meio comprimido).",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ciclopentolato",
      "concentracao": "1% - Colírio",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Cinarizina",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "",
      "posologia": "Tomar 01 comprimido de 8/8 horas por 05 dias ou cessação da tontura. Tomar após as refeições.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ciprofloxacino",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "",
      "posologia": "Tomar 01 comprimido de 8/8 horas por 07 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Clenil",
      "concentracao": "HFA 50mcg",
      "forma": "",
      "qtde": "Contínuo",
      "posologia": "Agora: Inalar 06 jatos de 06/06 horas por 02 dias.\nApós isso: Inalar 06 jatos de 12/12 horas por 03 dias.\nPor fim: Inalar 06 jatos se tosse ou cheira",
      "tempo": "",
      "via": "Inalatório"
    },
    {
      "nome": "Clonazepam",
      "concentracao": "2,5mg/mL",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Clorexidina aquosa",
      "concentracao": "0.5% - Solução",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Colchicina",
      "concentracao": "0.5mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Compressas Frias",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "Aplicar compressas banhadas em líquido frio sobre o local acometido por 10 minutos de 6/6 horas",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Compressas Mornas",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "Aplicar compressas banhadas em líquido quente sobre o local acometido por 10 minutos de 6/6 horas",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Curativo",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Deflazacort",
      "concentracao": "Creme",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar fina camada em região acometida, de 08/08 horas, por 05 dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Dexclorfeniramina",
      "concentracao": "Pomada",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar fina camada em lesões 2 vezes ao dia",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Diclofenaco",
      "concentracao": "50mg",
      "forma": "",
      "qtde": "15 Comprimidos",
      "posologia": "Tomar 01 comprimido de 08/08 horas, por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Diclofenaco dietilamônio gel",
      "concentracao": "11.6mg/g",
      "forma": "",
      "qtde": "01 Tubo",
      "posologia": "Aplicar fina camada sobre o local doloroso de 06/06 horas por 01 semana",
      "tempo": "",
      "via": "Externo - Tópico"
    },
    {
      "nome": "Diosmina + Hesperidina maior",
      "concentracao": "900/100mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido ao dia após as refeições",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Diosmina + Hesperidina menor",
      "concentracao": "450/50mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido de 12/12 horas após as refeições",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dipirona",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 02 comprimidos, de 06/06 horas, se dor ou febre",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dipirona gotas",
      "concentracao": "500mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Dar 0,8 gts/kg de 6/6 horas se dor ou febre",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dipirona xarope",
      "concentracao": "50mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Dar 0,4 mL/kg de 6/6 horas se dor ou febre",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dolutegravir",
      "concentracao": "75mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Domperidona",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido 30 minutos, antes do almoço e antes do jantar",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Enterogermina Plus",
      "concentracao": "",
      "forma": "",
      "qtde": "05 Flaconetes",
      "posologia": "Tomar 01 flaconete ao dia por 05 dias ou até cessar a diarreia",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Flogoral",
      "concentracao": "Pastilha",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Dissolver 01 pastilha sobre a lingua de 06/06 horas por 07 dias ou até melhora da dor.\nNão se alimentar em até 30 minutos após o uso da medicação",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Floratil",
      "concentracao": "250mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, de 12/12 horas, por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Fluconazol",
      "concentracao": "150mg",
      "forma": "",
      "qtde": "01 Comprimido",
      "posologia": "Tomar 01 comprimido.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Fluoxetina",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "Contínuo",
      "posologia": "Tomar 01 comprimido pela manhã",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Flurbiprofeno",
      "concentracao": "8.75mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Dissolver 01 pastilha sobre a lingua de 06/06 horas por 07 dias ou até melhora da dor.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Fosfomicina Trometamol",
      "concentracao": "3g",
      "forma": "",
      "qtde": "01 Sachê",
      "posologia": "Dissolver o conteúdo do envelope em meio copo de água e tomar em DOSE ÚNICA, antes de deitar e logo após esvaziar a bexiga.\nTomar com o estômago vazio (2 a 3 horas após a última refeição).",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Furoato de Mometasona Creme",
      "concentracao": "1mg/g",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar na região acometida de 06/06 horas, por 05 dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Hialuronato de sódio",
      "concentracao": "0.15% - Gel",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Hidroxizina",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido antes de dormir por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ibuprofeno",
      "concentracao": "600mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, de 08/08 horas, se dor, mesmo com o uso de dipirona, por no máximo 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ibuprofeno ped",
      "concentracao": "200mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Dar 0,5 gts/kg de 8/8 horas por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ivermectina",
      "concentracao": "6mg",
      "forma": "",
      "qtde": "0,2mg/kg Comprimidos",
      "posologia": "Tomar x Comprimidos agora.\nRepetir mesma dose em 01 semana",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Lacrifilm",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Lactulose",
      "concentracao": "667mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar 15mL de 12/12 horas.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Lamivudina/Tenofovir",
      "concentracao": "300/300mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Lavagem nasal",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "Realizar lavagem com serigna, conforme orientado em consultório.",
      "tempo": "",
      "via": "Nasal"
    },
    {
      "nome": "Levonogestrel / Etinilestradiol",
      "concentracao": "150 / 30mcg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Lidocaína gel",
      "concentracao": "0.05",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Loratadina",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido ao dia, se coçeira ou secreção nasal",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Meclin",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido de 6/6 horas se náuseas ou vômitos",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Meia de Compressão Graduada",
      "concentracao": "3/4 - 20 a 30 mmHg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Meloxicam",
      "concentracao": "7.5mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metoclopramida",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, de 08/08 horas, se náusea ou vômitos",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metoclopramida gotas",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metronidazol",
      "concentracao": "250mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Mupirocina",
      "concentracao": "2% - Pomada",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Naproxeno",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nebacetim Pomada",
      "concentracao": "",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar fina camada em lesões, de 12/12 horas.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Neomicina + Bacitracina",
      "concentracao": "5mg + 250UI/g - Pomada",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Nistatina",
      "concentracao": "Pomada",
      "forma": "",
      "qtde": "01 Tubo",
      "posologia": "Aplicar em vagina ao deitar, por 14 dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Nistatina Pomada",
      "concentracao": "25.000u/g",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Nistatina Suspensão Oral",
      "concentracao": "100.000 Ui/mL",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Olopatadina",
      "concentracao": "1mg/mL",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Omeprazol",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, em jejum, pela manhã",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Paracetamol",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Permetrina",
      "concentracao": "5% - Pomada",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Prednisolona",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Prednisolona Colírio",
      "concentracao": "0.01",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Prednisolona xarope",
      "concentracao": "3mg/mL",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Prednisona",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 02 comprimidos, pela manhã, durante 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Proctfis H",
      "concentracao": "Ou Similar",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Retal"
    },
    {
      "nome": "Prometazina",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, antes de dormir, por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Pyridium",
      "concentracao": "200mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Racecadotrila",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Salbutamol",
      "concentracao": "100mcg",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Inalar 04 jatos, de 06/06 horas, se tosse persistente, chieira no peito ou falta de ar.",
      "tempo": "",
      "via": "Inalatório"
    },
    {
      "nome": "Simeticona",
      "concentracao": "75mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar 30 gotas, de 08/08 horas, por 05 dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Soro Antirrábico",
      "concentracao": "",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Injetável"
    },
    {
      "nome": "Soro de Reidratação Oral",
      "concentracao": "",
      "forma": "",
      "qtde": "04 Sachês",
      "posologia": "Diluir 01 sachê em 01 Litro de água. Tomar formulação várias vezes ao dia.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Soro Fisiológico",
      "concentracao": "0.009",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Para Hidratação"
    },
    {
      "nome": "Sulfadiazina de Prata",
      "concentracao": "1% - Creme",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Tansulozina",
      "concentracao": "0.4mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Terbinafina",
      "concentracao": "250mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Tiorfan",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 01 comprimido, de 12/12 horas, se diarreia persistente",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Tobramicina",
      "concentracao": "0.003",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Tramadol",
      "concentracao": "50mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Trimebutina",
      "concentracao": "200mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Trometamol Cetorolaco",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Tropinal",
      "concentracao": "",
      "forma": "",
      "qtde": "01 Caixa",
      "posologia": "Tomar 02 comprimidos de 08/08 horas, se dor abdominal.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Valerato de Betametasona",
      "concentracao": "1mg/g - Pomada",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Vitamina D",
      "concentracao": "5.000 UI",
      "forma": "",
      "qtde": "",
      "posologia": "",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Acetato De Medroxiprogesterona + Cipionato De Estradiol",
      "concentracao": "25mg+5mg/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via intramuscular profunda, de 3 em 3 meses.",
      "tempo": "",
      "via": "Intramuscular"
    },
    {
      "nome": "Ácido Acetilsalicílico",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ácido Fólico (vitamina B9)",
      "concentracao": "0.2mg",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ácido Fólico (vitamina B9)",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Agulha Para Caneta Aplicadora De Insulina Nph/Regular/Ação Rápida/Ação Prolongada",
      "concentracao": "",
      "forma": "",
      "qtde": "____ Unidades",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Albendazol",
      "concentracao": "40mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar 10 mL (400 mg) por via oral, em dose única.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Albendazol",
      "concentracao": "400mg",
      "forma": "",
      "qtde": "01 Comprimido",
      "posologia": "Tomar 01 comprimido mastigável por via oral, em dose única.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Alendronato De Sódio",
      "concentracao": "70mg",
      "forma": "",
      "qtde": "04 Comprimidos",
      "posologia": "Tomar 01 comprimido por via oral uma vez por semana, em jejum, com um copo cheio de água, pelo menos 30 minutos antes do café da manhã. Não se deitar após a ingestão.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Algestona + Estradiol",
      "concentracao": "150+10mg/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via intramuscular profunda, no 8º dia do ciclo menstrual (contando o primeiro dia da menstruação como dia 1).",
      "tempo": "",
      "via": "Intramuscular"
    },
    {
      "nome": "Alopurinol",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Alopurinol",
      "concentracao": "300mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amiodarona",
      "concentracao": "200mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amitriptilina Cloridrato",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Amoxicilina",
      "concentracao": "50mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Anlodipino Besilato",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Anlodipino Besilato",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Atenolol",
      "concentracao": "50mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Azitromicina",
      "concentracao": "40mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Azitromicina",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Benzoilmetronidazol",
      "concentracao": "40mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Biperideno Cloridrato",
      "concentracao": "2mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Caneta Reutilizável Para Aplicação De Insulina C/ Sist. De Aplicação -",
      "concentracao": "3ml",
      "forma": "",
      "qtde": "____",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Outro"
    },
    {
      "nome": "Captopril",
      "concentracao": "50mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carbamazepina",
      "concentracao": "20mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carbamazepina",
      "concentracao": "200mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carvedilol",
      "concentracao": "12.5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carvedilol",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carvedilol",
      "concentracao": "3.125mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Carvedilol",
      "concentracao": "6.25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Cefalexina",
      "concentracao": "50mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Cetoconazol",
      "concentracao": "20mg/g",
      "forma": "",
      "qtde": "01 Tubo",
      "posologia": "Aplicar fina camada de creme sobre a região afetada, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Ciprofloxacino Cloridrato",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Clonazepam",
      "concentracao": "2mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Cloreto De Sódio",
      "concentracao": "9mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Aplicar ____ borrifadas/gotas em cada narina, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Nasal"
    },
    {
      "nome": "Clorpromazina Cloridrato",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Clorpromazina Cloridrato",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dexametasona",
      "concentracao": "0.1mg/mL",
      "forma": "",
      "qtde": "____",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Outro"
    },
    {
      "nome": "Dexametasona",
      "concentracao": "1mg/g",
      "forma": "",
      "qtde": "01 Tubo",
      "posologia": "Aplicar fina camada de creme sobre a região afetada, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Dexclorfeniramina Maleato",
      "concentracao": "0.4mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dexclorfeniramina Maleato",
      "concentracao": "2.0mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Diazepam",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Diazepam",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Digoxina",
      "concentracao": "0.25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dipirona Sódica",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Dipirona Sódica",
      "concentracao": "500mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Enalapril Maleato",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Enalapril Maleato",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Enalapril Maleato",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Fenitoina Sódica",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Fenobarbital Sodico",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Fenobarbital Sodico",
      "concentracao": "40mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Fluoxetina Cloridrato",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Furosemida",
      "concentracao": "40mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Glibenclamida",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Gliclazida",
      "concentracao": "30mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Glicosímetro (monitor De Glicose)",
      "concentracao": "",
      "forma": "",
      "qtde": "____",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Outro"
    },
    {
      "nome": "Haloperidol",
      "concentracao": "1mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Haloperidol",
      "concentracao": "2mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Haloperidol",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Haloperidol Decanoato",
      "concentracao": "50mg/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via intramuscular, conforme orientação médica.",
      "tempo": "",
      "via": "Intramuscular"
    },
    {
      "nome": "Heparina Sódica",
      "concentracao": "5000ui/0.25ml",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via subcutâneo, conforme orientação médica.",
      "tempo": "",
      "via": "Subcutâneo"
    },
    {
      "nome": "Hidroclorotiazida",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Ibuprofeno",
      "concentracao": "50mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Imipramina Cloridrato",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Insulina Humana Nph",
      "concentracao": "100ui/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via subcutâneo, conforme orientação médica.",
      "tempo": "",
      "via": "Subcutâneo"
    },
    {
      "nome": "Insulina Humana Regular",
      "concentracao": "100ui/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via subcutâneo, conforme orientação médica.",
      "tempo": "",
      "via": "Subcutâneo"
    },
    {
      "nome": "Isossorbida Mononitrato",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Isossorbida Mononitrato",
      "concentracao": "40mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Lanceta Descartável Estéril Para Lancetador",
      "concentracao": "",
      "forma": "",
      "qtde": "____ Unidades",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Lancetador",
      "concentracao": "",
      "forma": "",
      "qtde": "____ Unidades",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Levodopa + Carbidopa",
      "concentracao": "250+25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levonorgestrel + Etinilestradiol",
      "concentracao": "0.15+0.03mg",
      "forma": "",
      "qtde": "01 Cartela",
      "posologia": "Tomar 01 comprimido ao dia, por via oral, preferencialmente no mesmo horário, sem interrupção.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levotiroxina Sódica",
      "concentracao": "100mcg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levotiroxina Sódica",
      "concentracao": "125mcg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levotiroxina Sódica",
      "concentracao": "150mcg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levotiroxina Sódica",
      "concentracao": "25mcg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levotiroxina Sódica",
      "concentracao": "50mcg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Levotiroxina Sódica",
      "concentracao": "75mcg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Lítio Carbonato",
      "concentracao": "300mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Loratadina",
      "concentracao": "1mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Medroxiprogesterona Acetato",
      "concentracao": "150mg/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via intramuscular profunda, de 3 em 3 meses.",
      "tempo": "",
      "via": "Intramuscular"
    },
    {
      "nome": "Metildopa",
      "concentracao": "250mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metildopa",
      "concentracao": "500mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metoclopramida Cloridrato",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metoclopramida Cloridrato",
      "concentracao": "4mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Metronidazol",
      "concentracao": "100mg/g",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar 01 aplicador cheio de gel por via vaginal, ao deitar, por ____ dias.",
      "tempo": "",
      "via": "Vaginal"
    },
    {
      "nome": "Miconazol Nitrato",
      "concentracao": "20mg/g",
      "forma": "",
      "qtde": "01 Bisnaga",
      "posologia": "Aplicar 01 aplicador cheio de creme por via vaginal, ao deitar, por ____ dias.",
      "tempo": "",
      "via": "Vaginal"
    },
    {
      "nome": "Neomicina + Bacitracina",
      "concentracao": "5+250mg/g",
      "forma": "",
      "qtde": "01 Tubo",
      "posologia": "Aplicar fina camada de pomada sobre a região afetada, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Tópico"
    },
    {
      "nome": "Nifedipino",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nifedipino",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nistatina",
      "concentracao": "100000ui/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nitrofurantoina",
      "concentracao": "100mg",
      "forma": "",
      "qtde": "____ Cápsulas",
      "posologia": "Tomar ____ cápsula(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Noretisterona",
      "concentracao": "0.35mg",
      "forma": "",
      "qtde": "01 Cartela",
      "posologia": "Tomar 01 comprimido ao dia, por via oral, preferencialmente no mesmo horário, sem interrupção.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Noretisterona + Estradiol Enantato + Valerato",
      "concentracao": "50+5mg/mL",
      "forma": "",
      "qtde": "01 Ampola",
      "posologia": "Aplicar 01 ampola, por via intramuscular profunda, a cada 30 dias.",
      "tempo": "",
      "via": "Intramuscular"
    },
    {
      "nome": "Norfloxacino",
      "concentracao": "400mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nortriptilina Cloridrato",
      "concentracao": "10mg",
      "forma": "",
      "qtde": "____ Cápsulas",
      "posologia": "Tomar ____ cápsula(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nortriptilina Cloridrato",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Cápsulas",
      "posologia": "Tomar ____ cápsula(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Nortriptilina Cloridrato",
      "concentracao": "50mg",
      "forma": "",
      "qtde": "____ Cápsulas",
      "posologia": "Tomar ____ cápsula(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Oseltamivir Fosfato",
      "concentracao": "75mg",
      "forma": "",
      "qtde": "____ Cápsulas",
      "posologia": "Tomar ____ cápsula(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Paracetamol",
      "concentracao": "200mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Prednisolona Fosfato Sodico",
      "concentracao": "3mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Prednisona",
      "concentracao": "20mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Prednisona",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Prometazina Cloridrato",
      "concentracao": "25mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Propranolol Cloridrato",
      "concentracao": "40mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Sais De Reidratacao Oral (cloreto De Sódio + Glicose + Citrato De Sódio + Cloreto De Potássio)",
      "concentracao": "3.5+20.0+2.9+1.5g",
      "forma": "",
      "qtde": "____ Sachês",
      "posologia": "Diluir o conteúdo do sachê em ____ mL de água filtrada e tomar ao longo do dia, conforme orientação médica.",
      "tempo": "",
      "via": "Para Hidratação"
    },
    {
      "nome": "Salbutamol Sulfato",
      "concentracao": "100mcg",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Fazer ____ jato(s) por via inalatória, de ____ em ____ horas, se necessário.",
      "tempo": "",
      "via": "Inalatório"
    },
    {
      "nome": "Seringa Para Aplicação De Insulina -",
      "concentracao": "0.3ml",
      "forma": "",
      "qtde": "____ Unidades",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Seringa Para Aplicação De Insulina -",
      "concentracao": "1.0ml",
      "forma": "",
      "qtde": "____ Unidades",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Sulfametoxazol + Trimetroprima",
      "concentracao": "40+8mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Sulfametoxazol + Trimetroprima",
      "concentracao": "400+80mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Sulfato Ferroso",
      "concentracao": "122.97mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Sulfato Ferroso",
      "concentracao": "125mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Timolol Maleato",
      "concentracao": "5mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Aplicar 01 gota no olho afetado, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oftálmico"
    },
    {
      "nome": "Tiras Reagentes Para Medição De Glicemia",
      "concentracao": "",
      "forma": "",
      "qtde": "____ Unidades",
      "posologia": "Usar conforme orientação médica.",
      "tempo": "",
      "via": "Externo"
    },
    {
      "nome": "Valproato De Sódio (ácido Valpróico)",
      "concentracao": "250mg",
      "forma": "",
      "qtde": "____ Cápsulas",
      "posologia": "Tomar ____ cápsula(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Valproato De Sódio (ácido Valpróico)",
      "concentracao": "50mg/mL",
      "forma": "",
      "qtde": "01 Frasco",
      "posologia": "Tomar ____ mL por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Varfarina Sódica",
      "concentracao": "5mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    },
    {
      "nome": "Verapamil Cloridrato",
      "concentracao": "80mg",
      "forma": "",
      "qtde": "____ Comprimidos",
      "posologia": "Tomar ____ comprimido(s) por via oral, de ____ em ____ horas, por ____ dias.",
      "tempo": "",
      "via": "Oral"
    }
  ]
};
