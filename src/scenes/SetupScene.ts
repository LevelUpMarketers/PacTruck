import Phaser from 'phaser';
import { companyProfiles, getCompanyProfile } from '../config/companyProfiles';
import type { ProfileId } from '../config/companyProfiles';
import { COMPANY_NAME_MAX_LENGTH, createEmptySetup, normalizeSetup } from '../state/RunSetup';
import type { RunSetup } from '../state/RunSetup';
import { createScenePanel, focusScreen } from '../ui/ScenePanel';

export class SetupScene extends Phaser.Scene {
  private setup: RunSetup = createEmptySetup();

  constructor() {
    super('setup');
  }

  init(data: { setup: RunSetup }): void {
    this.setup = data.setup;
  }

  create(): void {
    const panel = createScenePanel(this, 'Company setup');
    panel.innerHTML = `
      <h2>Meet the local competition</h2>
      <p>Give your business a name and choose how it starts.</p>
      <form>
        <div class="superpath-hvac-game__fields superpath-hvac-game__fields--two">
          <label>Company Name (required)
            <input name="companyName" type="text" required maxlength="${COMPANY_NAME_MAX_LENGTH}" autocomplete="organization">
          </label>
          <label>Email (optional)
            <input name="email" type="email" maxlength="254" autocomplete="email">
            <span class="superpath-hvac-game__hint">Your email is optional and stays private.</span>
          </label>
        </div>
        <fieldset>
          <legend>Name three local competitors</legend>
          <p class="superpath-hvac-game__hint">Leave any blank and we'll use a generic company name.</p>
          <div class="superpath-hvac-game__fields superpath-hvac-game__fields--three">
            ${[0, 1, 2].map(index => `<label>Competitor ${index + 1}<input name="competitor${index}" type="text" maxlength="${COMPANY_NAME_MAX_LENGTH}" autocomplete="off"></label>`).join('')}
          </div>
        </fieldset>
        <fieldset>
          <legend>Choose your starting company profile</legend>
          <div class="superpath-hvac-game__profiles"></div>
        </fieldset>
        <div class="superpath-hvac-game__actions">
          <button type="button" class="superpath-hvac-game__button superpath-hvac-game__button--secondary">Back</button>
          <button type="submit" class="superpath-hvac-game__button">Next</button>
        </div>
      </form>`;

    const form = panel.querySelector('form')!;
    const company = form.elements.namedItem('companyName') as HTMLInputElement;
    const email = form.elements.namedItem('email') as HTMLInputElement;
    company.value = this.setup.companyName;
    email.value = this.setup.email;
    this.setup.competitorNames.forEach((name, index) => {
      (form.elements.namedItem(`competitor${index}`) as HTMLInputElement).value = name;
    });

    const profiles = panel.querySelector('.superpath-hvac-game__profiles')!;
    for (const profile of companyProfiles) {
      const card = document.createElement('label');
      card.className = 'superpath-hvac-game__profile';
      card.innerHTML = '<span><input type="radio" name="profileId"><strong></strong></span><span class="superpath-hvac-game__hint"></span><span class="superpath-hvac-game__profile-stats"></span>';
      const radio = card.querySelector('input')!;
      radio.value = profile.id;
      radio.checked = profile.id === this.setup.profileId;
      card.querySelector('strong')!.textContent = profile.name;
      card.querySelector('.superpath-hvac-game__hint')!.textContent = profile.description;
      card.querySelector('.superpath-hvac-game__profile-stats')!.textContent =
        `${Math.round(profile.bookingRate * 100)}% booking · ${Math.round((1 + profile.speedBonus) * 100)}% speed · ${profile.jobsPerTeam * 2} jobs/month`;
      profiles.append(card);
    }

    const readDraft = (): RunSetup => {
      const data = new FormData(form);
      return {
        companyName: company.value,
        email: email.value,
        competitorNames: [0, 1, 2].map(index => String(data.get(`competitor${index}`) ?? '')) as [string, string, string],
        profileId: getCompanyProfile(String(data.get('profileId')) as ProfileId).id,
      };
    };

    company.addEventListener('input', () => company.setCustomValidity(''));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!company.value.trim()) company.setCustomValidity('Enter your company name.');
      if (!form.reportValidity()) return;

      form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = true;
      this.scene.start('instructions', { setup: normalizeSetup(readDraft()) });
    });
    const back = form.querySelector<HTMLButtonElement>('button[type="button"]')!;
    back.addEventListener('click', () => {
      back.disabled = true;
      this.scene.start('title', { setup: readDraft(), returnFocus: true });
    });
    focusScreen(company);
  }
}
