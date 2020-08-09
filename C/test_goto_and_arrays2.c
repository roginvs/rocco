volatile int q;
int main() {
    int i = 3;

    label3:;
    if (q == 1) {
        i = 4;
        char arr[i];
        i = 5;
        arr[0] = 10;
        if (q==1) {
            goto label3;
        }
        arr[0] = 20;
        i = 6;
    };
    label2:;

}