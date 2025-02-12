export interface UseCase {
    execute(...args: any[]): Promise<void>;
}