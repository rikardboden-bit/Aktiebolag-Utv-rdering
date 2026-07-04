import {
  Comparison,
  ModelInputs,
  computeAB,
  findBreakEven,
} from "./model";
import { kr } from "./format";

/**
 * "AI-insikt": regelbaserade förklaringar på enkel svenska av vad som driver
 * resultatet i just den här simuleringen.
 */
export function buildInsights(inputs: ModelInputs, c: Comparison): string[] {
  const out: string[] = [];
  const breakEven = findBreakEven(inputs);
  const { ab, priv } = c;

  // Huvudslutsats
  if (c.diffTotal <= 0) {
    if (c.adminEffect > Math.abs(c.vatEffect)) {
      out.push(
        `AB blir inte bättre här eftersom administrationskostnaden (${kr(
          c.adminEffect
        )}/år för bokföring, bank och bolagskostnader) äter upp momsfördelen (${kr(
          c.vatEffect
        )}/år).`
      );
    } else {
      out.push(
        `Vid ${kr(
          inputs.rental.annualRevenueInclVat
        )} i årsintäkter är det privata alternativet ${kr(
          -c.diffTotal
        )} bättre per år. Volymen är för låg för att AB:ts fördelar ska slå igenom.`
      );
    }
  } else if (c.diffPaidOut <= 0) {
    out.push(
      `AB ger mindre i fickan i år (${kr(
        c.diffPaidOut
      )}), men räknar du med pengarna som stannar i bolaget (${kr(
        ab.retainedInCompany
      )}) är AB totalt ${kr(c.diffTotal)} bättre. Om du ändå inte behöver ta ut pengarna privat kan AB vara mer fördelaktigt.`
    );
  } else {
    out.push(
      `AB ser ekonomiskt motiverat ut här: ${kr(
        c.diffTotal
      )} bättre per år totalt, varav ${kr(c.diffPaidOut)} direkt i fickan.`
    );
  }

  // Break-even
  if (breakEven != null) {
    if (breakEven > inputs.rental.annualRevenueInclVat) {
      out.push(
        `Break-even ligger runt ${kr(
          breakEven
        )} i årsintäkter – först där börjar AB löna sig med dina nuvarande antaganden.`
      );
    } else {
      out.push(
        `Du ligger redan över break-even-nivån (cirka ${kr(breakEven)} i årsintäkter).`
      );
    }
  } else {
    out.push(
      "Med nuvarande antaganden hittar modellen ingen break-even-nivå under 1 mkr – kolla särskilt administrationskostnaderna."
    );
  }

  // Vad driver resultatet?
  const drivers: { label: string; value: number }[] = [
    { label: "momsavdraget på inköp och kostnader", value: c.vatEffect },
    {
      label: "lägre skatt på utdelning inom gränsbeloppet",
      value:
        ab.dividendWithinAllowance *
        ((priv.marginalTaxRate - inputs.assumptions.dividendTaxRate) / 100),
    },
    {
      label: "möjligheten att behålla vinst i bolaget till 20,6 % skatt",
      value: ab.retainedInCompany,
    },
  ].sort((a, b) => b.value - a.value);
  if (drivers[0].value > 0) {
    out.push(
      `Största fördelen med AB i din simulering kommer från ${drivers[0].label} (${kr(
        drivers[0].value
      )}/år).`
    );
  }

  // Moms
  if (!inputs.rental.vatRegistered) {
    const withVat = computeAB(inputs, { vatRegisteredOverride: true });
    const delta =
      withVat.netPrivate +
      withVat.retainedInCompany -
      (ab.netPrivate + ab.retainedInCompany);
    if (delta > 0) {
      out.push(
        `Momsregistrering skulle förbättra AB-utfallet med cirka ${kr(
          delta
        )}/år tack vare momsavdrag på inköpen.`
      );
    }
  } else if (c.vatEffect < 0) {
    out.push(
      `Momsregistreringen kostar dig netto ${kr(
        -c.vatEffect
      )}/år – utgående moms på hyresintäkterna är större än momsavdraget på inköpen. Under 120 000 kr i omsättning kan du välja bort moms.`
    );
  }

  // Återinvestering
  if (
    inputs.rental.purchasesPerYear >
    inputs.rental.annualRevenueInclVat * 0.3
  ) {
    out.push(
      "Du återinvesterar en stor andel av intäkterna i nya prylar – det är precis det läget där AB:ts momsavdrag och lägre bolagsskatt gör störst nytta."
    );
  } else if (c.diffTotal <= 0 && inputs.rental.purchasesPerYear > 0) {
    out.push(
      "AB blir mer intressant först när du återinvesterar mycket i nya prylar – testa att dra upp inköpen i känslighetsanalysen."
    );
  }

  // Lön vs utdelning
  if (ab.salary > 0 && ab.marginalTaxRate > 45) {
    out.push(
      `Lön från AB beskattas hos dig med cirka ${ab.marginalTaxRate.toFixed(
        0
      )} % marginalskatt plus arbetsgivaravgifter – med din befintliga lön är utdelning inom gränsbeloppet nästan alltid billigare.`
    );
  }
  if (ab.dividendExcess > 0) {
    out.push(
      `${kr(
        ab.dividendExcess
      )} av utdelningen ligger över gränsbeloppet och beskattas som tjänst – överväg att spara utrymmet till kommande år i stället.`
    );
  }

  // Admin
  const abTotalValue = ab.netPrivate + ab.retainedInCompany;
  if (c.adminEffect > 0 && abTotalValue > 0 && c.adminEffect > abTotalValue * 0.5) {
    out.push(
      `Administrationen (${kr(
        c.adminEffect
      )}/år) motsvarar över hälften av det AB:t genererar – kan du bokföra själv ändras kalkylen rejält.`
    );
  }

  return out;
}
