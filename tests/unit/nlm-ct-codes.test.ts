/// <reference types="jest" />
import { definition, handler } from '../../src/tools/nlm-ct-codes';

describe('nlm_ct_codes Tool', () => {
  describe('Definition', () => {
    it('should have correct name', () => {
      expect(definition.name).toBe('nlm_ct_codes');
    });

    it('should have description mentioning all coding systems', () => {
      expect(definition.description).toContain('ICD-10-CM');
      expect(definition.description).toContain('HCPCS');
      expect(definition.description).toContain('NPI');
      expect(definition.description).toContain('HPO');
      expect(definition.description).toContain('Medical Conditions');
    });

    it('should require method and terms parameters', () => {
      expect(definition.inputSchema.required).toEqual(['method', 'terms']);
    });

    it('should have method enum with correct values', () => {
      expect(definition.inputSchema.properties.method.enum).toEqual([
        'icd-10-cm',
        'icd-11',
        'hcpcs-LII',
        'npi-organizations',
        'npi-individuals',
        'hpo-vocabulary',
        'conditions',
        'rx-terms',
        'loinc-questions',
        'ncbi-genes',
        'major-surgeries-implants',
      ]);
    });

    it('should have comprehensive response schema', () => {
      expect(definition.responseSchema).toBeDefined();
      expect(definition.responseSchema!.required).toEqual([
        'method',
        'totalCount',
        'results',
        'pagination',
      ]);
    });

    it('should have examples for all methods', () => {
      expect(definition.examples).toBeDefined();
      expect(definition.examples!).toHaveLength(71);

      // Should have ICD-10-CM examples
      const icdExamples = definition.examples!.filter(ex => ex.usage.method === 'icd-10-cm');
      expect(icdExamples).toHaveLength(3);

      // Should have HCPCS examples
      const hcpcsExamples = definition.examples!.filter(ex => ex.usage.method === 'hcpcs-LII');
      expect(hcpcsExamples).toHaveLength(5);

      // Should have NPI Organizations examples
      const npiOrgExamples = definition.examples!.filter(
        ex => ex.usage.method === 'npi-organizations'
      );
      expect(npiOrgExamples).toHaveLength(9);

      // Should have NPI Individuals examples
      const npiIndExamples = definition.examples!.filter(
        ex => ex.usage.method === 'npi-individuals'
      );
      expect(npiIndExamples).toHaveLength(9);

      // Should have HPO Vocabulary examples
      const hpoExamples = definition.examples!.filter(ex => ex.usage.method === 'hpo-vocabulary');
      expect(hpoExamples).toHaveLength(7);

      // Should have Conditions examples
      const conditionsExamples = definition.examples!.filter(
        ex => ex.usage.method === 'conditions'
      );
      expect(conditionsExamples).toHaveLength(6);

      // Should have RxTerms examples
      const rxTermsExamples = definition.examples!.filter(ex => ex.usage.method === 'rx-terms');
      expect(rxTermsExamples).toHaveLength(6);

      // Should have LOINC Questions examples
      const loincExamples = definition.examples!.filter(
        ex => ex.usage.method === 'loinc-questions'
      );
      expect(loincExamples).toHaveLength(8);

      // Should have NCBI Genes examples
      const ncbiGenesExamples = definition.examples!.filter(ex => ex.usage.method === 'ncbi-genes');
      expect(ncbiGenesExamples).toHaveLength(6);

      // Should have Major Surgeries and Implants examples
      const majorSurgeriesImplantsExamples = definition.examples!.filter(
        ex => ex.usage.method === 'major-surgeries-implants'
      );
      expect(majorSurgeriesImplantsExamples).toHaveLength(6);

      // Should have ICD-11 examples
      const icd11Examples = definition.examples!.filter(ex => ex.usage.method === 'icd-11');
      expect(icd11Examples).toHaveLength(6);
    });
  });

  describe('Handler Validation', () => {
    it('should throw error when method is missing', async () => {
      await expect(handler({ terms: 'test' })).rejects.toThrow(
        'The "method" parameter is required and must be a string'
      );
    });

    it('should throw error when method is invalid', async () => {
      await expect(handler({ method: 'invalid', terms: 'test' })).rejects.toThrow(
        'The "method" parameter must be one of: "icd-10-cm", "icd-11", "hcpcs-LII", "npi-organizations", "npi-individuals", "hpo-vocabulary", "conditions", "rx-terms", "loinc-questions", "ncbi-genes", or "major-surgeries-implants"'
      );
    });

    it('should throw error when terms is missing', async () => {
      await expect(handler({ method: 'icd-10-cm' })).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });

    it('should throw error when terms is not a string', async () => {
      await expect(handler({ method: 'icd-10-cm', terms: 123 })).rejects.toThrow(
        'The "terms" parameter is required and must be a string'
      );
    });
  });

  describe('Schema Validation', () => {
    it('should require method parameter', () => {
      expect(definition.inputSchema.required).toContain('method');
      expect(definition.inputSchema.properties.method.enum).toEqual([
        'icd-10-cm',
        'icd-11',
        'hcpcs-LII',
        'npi-organizations',
        'npi-individuals',
        'hpo-vocabulary',
        'conditions',
        'rx-terms',
        'loinc-questions',
        'ncbi-genes',
        'major-surgeries-implants',
      ]);
    });

    it('should require terms parameter', () => {
      expect(definition.inputSchema.required).toContain('terms');
      expect(definition.inputSchema.properties.terms.type).toBe('string');
    });

    it('should have proper response schema', () => {
      expect(definition.responseSchema!.required).toContain('method');
      expect(definition.responseSchema!.required).toContain('totalCount');
      expect(definition.responseSchema!.required).toContain('results');
      expect(definition.responseSchema!.required).toContain('pagination');
    });
  });

  describe('Examples Validation', () => {
    it('should have comprehensive examples for ICD-10-CM, ICD-11, HCPCS, NPI Organizations, NPI Individuals, HPO Vocabulary, Conditions, RxTerms, LOINC Questions, NCBI Genes, and Major Surgeries and Implants', () => {
      expect(definition.examples!).toHaveLength(71);

      // Check ICD-10-CM examples
      const icdExamples = definition.examples!.filter(ex => ex.usage.method === 'icd-10-cm');
      expect(icdExamples).toHaveLength(3);
      expect(icdExamples.some(ex => ex.usage.terms === 'hypertension')).toBe(true);
      expect(icdExamples.some(ex => ex.usage.terms === 'S72')).toBe(true);
      expect(icdExamples.some(ex => ex.usage.terms === 'pneumonia')).toBe(true);

      // Check HCPCS examples
      const hcpcsExamples = definition.examples!.filter(ex => ex.usage.method === 'hcpcs-LII');
      expect(hcpcsExamples).toHaveLength(5);
      expect(hcpcsExamples.some(ex => ex.usage.terms === 'oxygen')).toBe(true);
      expect(hcpcsExamples.some(ex => ex.usage.terms === 'wheelchair')).toBe(true);
      expect(hcpcsExamples.some(ex => ex.usage.terms === 'E0470')).toBe(true);
      expect(hcpcsExamples.some(ex => ex.usage.terms === 'infusion pump')).toBe(true);
      expect(hcpcsExamples.some(ex => ex.usage.terms === 'ventilator')).toBe(true);

      // Check NPI Organizations examples
      const npiOrgExamples = definition.examples!.filter(
        ex => ex.usage.method === 'npi-organizations'
      );
      expect(npiOrgExamples).toHaveLength(9);
      expect(npiOrgExamples.some(ex => ex.usage.terms === 'bethesda')).toBe(true);
      expect(npiOrgExamples.some(ex => ex.usage.terms === 'MAYO CLINIC')).toBe(true);
      expect(npiOrgExamples.some(ex => ex.usage.terms === 'cardiology')).toBe(true);
      expect(npiOrgExamples.some(ex => ex.usage.terms === '1114343860')).toBe(true);
      expect(npiOrgExamples.some(ex => ex.usage.terms === 'Emergency Medicine')).toBe(true);
      expect(npiOrgExamples.some(ex => ex.usage.terms === 'hospital')).toBe(true);

      // Check NPI Individuals examples
      const npiIndExamples = definition.examples!.filter(
        ex => ex.usage.method === 'npi-individuals'
      );
      expect(npiIndExamples).toHaveLength(9);
      expect(npiIndExamples.some(ex => ex.usage.terms === 'john bethesda')).toBe(true);
      expect(npiIndExamples.some(ex => ex.usage.terms === 'physician')).toBe(true);
      expect(npiIndExamples.some(ex => ex.usage.terms === '1760880173')).toBe(true);
      expect(npiIndExamples.some(ex => ex.usage.terms === 'Emergency Medicine')).toBe(true);
      expect(npiIndExamples.some(ex => ex.usage.terms === 'nurse')).toBe(true);
      expect(npiIndExamples.some(ex => ex.usage.terms === 'cardiologist')).toBe(true);
      expect(npiIndExamples.some(ex => ex.usage.terms === 'smith')).toBe(true);

      // Check HPO Vocabulary examples
      const hpoExamples = definition.examples!.filter(ex => ex.usage.method === 'hpo-vocabulary');
      expect(hpoExamples).toHaveLength(7);
      expect(hpoExamples.some(ex => ex.usage.terms === 'blood pressure')).toBe(true);
      expect(hpoExamples.some(ex => ex.usage.terms === 'HP:0001871')).toBe(true);
      expect(hpoExamples.some(ex => ex.usage.terms === 'intellectual disability')).toBe(true);
      expect(hpoExamples.some(ex => ex.usage.terms === 'seizure')).toBe(true);
      expect(hpoExamples.some(ex => ex.usage.terms === 'growth')).toBe(true);
      expect(hpoExamples.some(ex => ex.usage.terms === 'cardiac')).toBe(true);

      // Check Conditions examples
      const conditionsExamples = definition.examples!.filter(
        ex => ex.usage.method === 'conditions'
      );
      expect(conditionsExamples).toHaveLength(6);
      expect(conditionsExamples.some(ex => ex.usage.terms === 'gastroenteritis')).toBe(true);
      expect(conditionsExamples.some(ex => ex.usage.terms === 'diabetes')).toBe(true);
      expect(conditionsExamples.some(ex => ex.usage.terms === 'colitis')).toBe(true);
      expect(conditionsExamples.some(ex => ex.usage.terms === 'hypertension')).toBe(true);
      expect(conditionsExamples.some(ex => ex.usage.terms === '4458')).toBe(true);

      // Check RxTerms examples
      const rxTermsExamples = definition.examples!.filter(ex => ex.usage.method === 'rx-terms');
      expect(rxTermsExamples).toHaveLength(6);
      expect(rxTermsExamples.some(ex => ex.usage.terms === 'arava')).toBe(true);
      expect(rxTermsExamples.some(ex => ex.usage.terms === 'articaine')).toBe(true);
      expect(rxTermsExamples.some(ex => ex.usage.terms === 'lisinopril')).toBe(true);
      expect(rxTermsExamples.some(ex => ex.usage.terms === 'insulin')).toBe(true);
      expect(rxTermsExamples.some(ex => ex.usage.terms === 'antibiotic')).toBe(true);

      // Check LOINC Questions examples
      const loincExamples = definition.examples!.filter(
        ex => ex.usage.method === 'loinc-questions'
      );
      expect(loincExamples).toHaveLength(8);
      expect(loincExamples.some(ex => ex.usage.terms === 'walk')).toBe(true);
      expect(loincExamples.some(ex => ex.usage.terms === 'vital signs')).toBe(true);
      expect(loincExamples.some(ex => ex.usage.terms === 'blood pressure')).toBe(true);
      expect(loincExamples.some(ex => ex.usage.terms === 'depression')).toBe(true);
      expect(loincExamples.some(ex => ex.usage.terms === '45593-1')).toBe(true);
      expect(loincExamples.some(ex => ex.usage.terms === 'assessment')).toBe(true);
      expect(loincExamples.some(ex => ex.usage.terms === 'glucose')).toBe(true);

      // Check NCBI Genes examples
      const ncbiGenesExamples = definition.examples!.filter(ex => ex.usage.method === 'ncbi-genes');
      expect(ncbiGenesExamples).toHaveLength(6);
      expect(ncbiGenesExamples.some(ex => ex.usage.terms === 'MTX')).toBe(true);
      expect(ncbiGenesExamples.some(ex => ex.usage.terms === 'BRCA1')).toBe(true);
      expect(ncbiGenesExamples.some(ex => ex.usage.terms === 'TP53')).toBe(true);
      expect(ncbiGenesExamples.some(ex => ex.usage.terms === 'insulin')).toBe(true);
      expect(ncbiGenesExamples.some(ex => ex.usage.terms === 'dystrophin')).toBe(true);
      expect(ncbiGenesExamples.some(ex => ex.usage.terms === 'oncogene')).toBe(true);

      // Check Major Surgeries and Implants examples
      const majorSurgeriesImplantsExamples = definition.examples!.filter(
        ex => ex.usage.method === 'major-surgeries-implants'
      );
      expect(majorSurgeriesImplantsExamples).toHaveLength(6);
      expect(majorSurgeriesImplantsExamples.some(ex => ex.usage.terms === 'gast')).toBe(true);
      expect(majorSurgeriesImplantsExamples.some(ex => ex.usage.terms === 'bypass')).toBe(true);
      expect(majorSurgeriesImplantsExamples.some(ex => ex.usage.terms === 'implant')).toBe(true);
      expect(majorSurgeriesImplantsExamples.some(ex => ex.usage.terms === 'surgery')).toBe(true);
      expect(majorSurgeriesImplantsExamples.some(ex => ex.usage.terms === 'heart')).toBe(true);
      expect(majorSurgeriesImplantsExamples.some(ex => ex.usage.terms === 'arthroscopy')).toBe(
        true
      );
    });
  });

  describe('Parameter Types and Defaults', () => {
    it('should have correct parameter types and constraints', () => {
      const props = definition.inputSchema.properties;

      expect(props.maxList.minimum).toBe(1);
      expect(props.maxList.maximum).toBe(500);
      expect(props.maxList.default).toBe(7);

      expect(props.offset.minimum).toBe(0);
      expect(props.offset.default).toBe(0);

      expect(props.count.minimum).toBe(1);
      expect(props.count.maximum).toBe(500);
      expect(props.count.default).toBe(7);
    });
  });
});
