import { MAX_TEXT_LENGTH, AUTO_CLOSE_PAIRS } from '../features/posts/components/modals/postTextConstants';

describe('postTextConstants', () => {
    describe('MAX_TEXT_LENGTH', () => {
        it('равна 8206', () => {
            expect(MAX_TEXT_LENGTH).toBe(8206);
        });

        it('является числом', () => {
            expect(typeof MAX_TEXT_LENGTH).toBe('number');
        });
    });

    describe('AUTO_CLOSE_PAIRS', () => {
        it('содержит все пары скобок', () => {
            expect(AUTO_CLOSE_PAIRS['(']).toBe(')');
            expect(AUTO_CLOSE_PAIRS['[']).toBe(']');
            expect(AUTO_CLOSE_PAIRS['{']).toBe('}');
        });

        it('содержит пары кавычек', () => {
            expect(AUTO_CLOSE_PAIRS['"']).toBe('"');
            expect(AUTO_CLOSE_PAIRS["'"]).toBe("'");
            expect(AUTO_CLOSE_PAIRS['«']).toBe('»');
        });

        it('содержит ровно 6 пар', () => {
            expect(Object.keys(AUTO_CLOSE_PAIRS)).toHaveLength(6);
        });
    });
});
