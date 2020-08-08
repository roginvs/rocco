#include <stdio.h>
/*

gcc -Wall -O0 -o test_goto_and_array.bin test_goto_and_array.c && ./test_goto_and_array.bin

clang -Wall -O0 -o test_goto_and_array.bin test_goto_and_array.c && ./test_goto_and_array.bin


https://www.onlinegdb.com/

*/

int i = 2;

void test(int* num) {
    register volatile long int *rsp asm("rsp");
    register volatile long int rsp2 asm("rsp");

    i = 0x100;

    label1:;

    char arr[i*0x10];

    long int volatile rsp_v = (long int)rsp;

    long int volatile rsp2_v= rsp2;

    int ebx_value;
    //asm volatile("" : "=rsp"(rsp2));
    //asm("movl %%esp, %0" : "=r" (rsp2));

    printf("Rsp value is %lX %lX ", rsp_v, rsp2_v);
    printf("Array pointer is %lX ", &arr);
    printf("num=%lX", *num);
    printf("\n");

    if (*num != 0) {
        i = i - 1;
        *num -= 1;
        goto label1;
    }

    arr[0] = *num;


}

int main() {
    int repeats = 10;
    test(&repeats);
    return 0;
}